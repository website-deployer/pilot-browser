"""
Search Service for the Pilot Browser.

This module provides search functionality across multiple search providers
with result aggregation and deduplication.
"""
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import aiohttp
import json
import time
from urllib.parse import quote_plus

from app.core.config import settings
from app.models.search import SearchResult, SearchProvider

# Configure logging
logger = logging.getLogger(__name__)

# Search provider configurations
SEARCH_PROVIDERS = {
    SearchProvider.GOOGLE: {
        "name": "Google",
        "url": "https://www.googleapis.com/customsearch/v1",
        "params": {
            "key": "{api_key}",
            "cx": "{search_engine_id}",
            "q": "{query}",
            "num": "{limit}",
            "start": "{offset}",
            "safe": "{safe_search}",
            "hl": "{language}",
            "gl": "{region}"
        },
        "headers": {
            "Accept": "application/json"
        },
        "response_parser": "parse_google_results"
    },
    SearchProvider.BING: {
        "name": "Bing",
        "url": "https://api.bing.microsoft.com/v7.0/search",
        "params": {
            "q": "{query}",
            "count": "{limit}",
            "offset": "{offset}",
            "safeSearch": "{safe_search}",
            "mkt": "{region}-{language}"
        },
        "headers": {
            "Ocp-Apim-Subscription-Key": "{api_key}",
            "Accept": "application/json"
        },
        "response_parser": "parse_bing_results"
    },
    SearchProvider.DUCKDUCKGO: {
        "name": "DuckDuckGo",
        "url": "https://api.duckduckgo.com/",
        "params": {
            "q": "{query}",
            "format": "json",
            "no_html": "1",
            "no_redirect": "1",
            "kp": "{safe_search}",
            "kl": "{language}",
            "region": "{region}"
        },
        "headers": {
            "Accept": "application/json"
        },
        "response_parser": "parse_duckduckgo_results"
    },
    SearchProvider.REDDIT: {
        "name": "Reddit",
        "url": "https://www.reddit.com/search.json",
        "params": {
            "q": "{query}",
            "limit": "{limit}",
            "after": "{offset}",
            "restrict_sr": "0",
            "sort": "relevance"
        },
        "headers": {
            "User-Agent": "PilotBrowser/1.0"
        },
        "response_parser": "parse_reddit_results"
    },
    SearchProvider.GITHUB: {
        "name": "GitHub",
        "url": "https://api.github.com/search/repositories",
        "params": {
            "q": "{query}",
            "per_page": "{limit}",
            "page": "{page}",
            "sort": "stars",
            "order": "desc"
        },
        "headers": {
            "Accept": "application/vnd.github.v3+json"
        },
        "response_parser": "parse_github_results"
    }
}

class SearchService:
    """Service for performing searches across multiple providers"""
    
    def __init__(self):
        self.session = None
        self.initialized = False
    
    async def initialize(self):
        """Initialize the search service"""
        if not self.initialized:
            self.session = aiohttp.ClientSession()
            self.initialized = True
            logger.info("SearchService initialized")
    
    async def cleanup(self):
        """Clean up resources"""
        if self.initialized and self.session:
            await self.session.close()
            self.initialized = False
            logger.info("SearchService cleaned up")
    
    async def search(
        self,
        query: str,
        providers: List[str] = None,
        limit: int = 10,
        offset: int = 0,
        safe_search: bool = True,
        region: str = "us",
        language: str = "en",
        user_id: int = None
    ) -> Dict[str, Any]:
        """
        Perform a search across multiple providers and aggregate the results.
        
        Args:
            query: The search query
            providers: List of provider names to use (default: all available)
            limit: Maximum number of results to return per provider
            offset: Offset for pagination
            safe_search: Whether to enable safe search filtering
            region: Region code for localized results
            language: Language code for results
            user_id: ID of the user making the request (for personalization)
            
        Returns:
            Dictionary containing aggregated search results
        """
        if not self.initialized:
            await self.initialize()
        
        # Use all providers if none specified
        if not providers:
            providers = [p.value for p in SearchProvider]
        
        # Filter out unsupported providers
        providers = [p for p in providers if p in SEARCH_PROVIDERS]
        
        if not providers:
            raise ValueError("No valid search providers specified")
        
        # Prepare search tasks
        search_tasks = []
        for provider in providers:
            task = self._search_provider(
                provider=provider,
                query=query,
                limit=limit,
                offset=offset,
                safe_search=safe_search,
                region=region,
                language=language,
                user_id=user_id
            )
            search_tasks.append(task)
        
        # Execute searches in parallel
        results = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        # Process results
        aggregated_results = []
        provider_errors = {}
        
        for i, result in enumerate(results):
            provider = providers[i]
            
            if isinstance(result, Exception):
                logger.error(f"Error searching with {provider}: {str(result)}")
                provider_errors[provider] = str(result)
                continue
                
            if result and "items" in result:
                aggregated_results.extend(result["items"])
        
        # Deduplicate results by URL
        seen_urls = set()
        deduped_results = []
        
        for result in aggregated_results:
            url = result.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                deduped_results.append(result)
        
        # Sort by relevance score if available, otherwise by provider ranking
        def get_sort_key(item):
            # Higher score comes first
            score = item.get("score", 0)
            # Prefer certain providers
            provider_rank = {
                "google": 1,
                "bing": 2,
                "duckduckgo": 3,
                "reddit": 4,
                "github": 5
            }.get(item.get("provider", "").lower(), 10)
            return (-score, provider_rank)
        
        sorted_results = sorted(deduped_results, key=get_sort_key)
        
        # Apply pagination
        paginated_results = sorted_results[offset:offset + limit]
        
        return {
            "query": query,
            "total_results": len(sorted_results),
            "page": (offset // limit) + 1,
            "page_size": limit,
            "results": paginated_results,
            "providers_used": providers,
            "provider_errors": provider_errors if provider_errors else None
        }
    
    async def _search_provider(
        self,
        provider: str,
        query: str,
        limit: int = 10,
        offset: int = 0,
        safe_search: bool = True,
        region: str = "us",
        language: str = "en",
        user_id: int = None
    ) -> Dict[str, Any]:
        """
        Perform a search using a specific provider.
        
        Args:
            provider: Name of the search provider
            query: The search query
            limit: Maximum number of results to return
            offset: Offset for pagination
            safe_search: Whether to enable safe search filtering
            region: Region code for localized results
            language: Language code for results
            user_id: ID of the user making the request
            
        Returns:
            Dictionary containing search results from the provider
        """
        if not self.initialized:
            await self.initialize()
        
        provider_config = SEARCH_PROVIDERS.get(provider)
        if not provider_config:
            raise ValueError(f"Unsupported search provider: {provider}")
        
        # Get API key from settings or environment
        api_key = getattr(settings, f"{provider.upper()}_API_KEY", "")
        
        # Format URL and parameters
        url = provider_config["url"]
        params = {}
        
        for param, value in provider_config["params"].items():
            try:
                # Format the parameter value with the current context
                formatted_value = value.format(
                    api_key=api_key,
                    query=quote_plus(query),
                    limit=limit,
                    offset=offset,
                    page=(offset // limit) + 1,
                    safe_search="moderate" if safe_search else "off",
                    region=region,
                    language=language,
                    search_engine_id=getattr(settings, f"{provider.upper()}_SEARCH_ENGINE_ID", "")
                )
                params[param] = formatted_value
            except (KeyError, IndexError):
                # If formatting fails, use the original value
                params[param] = value
        
        # Format headers
        headers = {}
        for header, value in provider_config.get("headers", {}).items():
            try:
                # Format header values with the current context
                formatted_value = value.format(
                    api_key=api_key,
                    user_agent="PilotBrowser/1.0"
                )
                headers[header] = formatted_value
            except (KeyError, IndexError):
                headers[header] = value
        
        # Add rate limiting delay if needed
        await self._rate_limit(provider)
        
        try:
            # Make the API request
            async with self.session.get(
                url,
                params=params,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(
                        f"Error from {provider} API: {response.status} - {error_text}"
                    )
                    return {"items": [], "error": f"API error: {response.status}"}
                
                # Parse the response
                response_data = await response.json()
                
                # Use the appropriate parser for this provider
                parser_name = provider_config.get("response_parser", "parse_basic_results")
                parser = getattr(self, parser_name, self.parse_basic_results)
                
                return parser(response_data, provider, query)
                
        except asyncio.TimeoutError:
            logger.warning(f"Timeout while searching with {provider}")
            return {"items": [], "error": "Request timed out"}
            
        except Exception as e:
            logger.error(f"Error searching with {provider}: {str(e)}", exc_info=True)
            return {"items": [], "error": str(e)}
    
    async def _rate_limit(self, provider: str):
        """Apply rate limiting for the specified provider"""
        # In a real implementation, this would track request timestamps
        # and add delays as needed to respect rate limits
        pass
    
    # Result parsers for different search providers
    
    def parse_google_results(self, data: Dict, provider: str, query: str) -> Dict[str, Any]:
        """Parse search results from Google Custom Search JSON API"""
        items = []
        
        for i, item in enumerate(data.get("items", [])):
            result = {
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "provider": provider,
                "score": 1.0 - (i * 0.01),  # Slight penalty for lower ranks
                "metadata": {
                    "displayLink": item.get("displayLink", ""),
                    "mime": item.get("mime", ""),
                    "fileFormat": item.get("fileFormat", ""),
                }
            }
            
            # Add image if available
            if "pagemap" in item and "cse_image" in item["pagemap"] and item["pagemap"]["cse_image"]:
                result["image_url"] = item["pagemap"]["cse_image"][0].get("src", "")
            
            items.append(result)
        
        return {
            "items": items,
            "total_results": int(data.get("searchInformation", {}).get("totalResults", 0))
        }
    
    def parse_bing_results(self, data: Dict, provider: str, query: str) -> Dict[str, Any]:
        """Parse search results from Bing Web Search API"""
        items = []
        
        for i, item in enumerate(data.get("webPages", {}).get("value", [])):
            result = {
                "title": item.get("name", ""),
                "url": item.get("url", ""),
                "snippet": item.get("snippet", ""),
                "provider": provider,
                "score": 1.0 - (i * 0.01),  # Slight penalty for lower ranks
                "metadata": {
                    "displayUrl": item.get("displayUrl", ""),
                    "datePublished": item.get("datePublished"),
                    "isNavigational": item.get("isNavigational", False)
                }
            }
            
            # Add thumbnail if available
            if "thumbnailUrl" in item:
                result["image_url"] = item["thumbnailUrl"]
            
            items.append(result)
        
        return {
            "items": items,
            "total_results": data.get("webPages", {}).get("totalEstimatedMatches", 0)
        }
    
    def parse_duckduckgo_results(self, data: Dict, provider: str, query: str) -> Dict[str, Any]:
        """Parse search results from DuckDuckGo API"""
        items = []
        
        # Process web results
        for i, result in enumerate(data.get("Results", [])):
            items.append({
                "title": result.get("Text", ""),
                "url": result.get("FirstURL", ""),
                "snippet": result.get("Result", ""),
                "provider": provider,
                "score": 0.9 - (i * 0.01),  # Slightly lower score than Google/Bing
                "metadata": {
                    "icon": result.get("Icon", {})
                }
            })
        
        # Process related topics
        for i, topic in enumerate(data.get("RelatedTopics", [])):
            if "FirstURL" in topic:
                items.append({
                    "title": topic.get("Text", ""),
                    "url": topic.get("FirstURL", ""),
                    "snippet": topic.get("Text", ""),
                    "provider": f"{provider}_related",
                    "score": 0.8 - (i * 0.005),  # Even lower score for related topics
                    "metadata": {
                        "icon": topic.get("Icon", {})
                    }
                })
        
        return {
            "items": items,
            "total_results": len(items)  # DuckDuckGo doesn't provide a total count
        }
    
    def parse_reddit_results(self, data: Dict, provider: str, query: str) -> Dict[str, Any]:
        """Parse search results from Reddit API"""
        items = []
        
        for i, post in enumerate(data.get("data", {}).get("children", [])):
            post_data = post.get("data", {})
            
            # Skip ads and other non-post items
            if post.get("kind") != "t3" or not post_data.get("url"):
                continue
            
            items.append({
                "title": post_data.get("title", ""),
                "url": f"https://reddit.com{post_data.get('permalink', '')}",
                "snippet": post_data.get("selftext", "")[:200] + "..." if post_data.get("selftext") else "",
                "provider": provider,
                "score": 0.8 - (i * 0.01),  # Reddit results get a lower base score
                "metadata": {
                    "subreddit": post_data.get("subreddit", ""),
                    "score": post_data.get("score", 0),
                    "num_comments": post_data.get("num_comments", 0),
                    "created_utc": post_data.get("created_utc"),
                    "author": post_data.get("author", ""),
                    "is_self": post_data.get("is_self", False),
                    "domain": post_data.get("domain", "")
                }
            })
        
        return {
            "items": items,
            "total_results": data.get("data", {}).get("dist", 0)
        }
    
    def parse_github_results(self, data: Dict, provider: str, query: str) -> Dict[str, Any]:
        """Parse search results from GitHub API"""
        items = []
        
        for i, repo in enumerate(data.get("items", [])):
            items.append({
                "title": repo.get("full_name", ""),
                "url": repo.get("html_url", ""),
                "snippet": repo.get("description", ""),
                "provider": provider,
                "score": 0.8 - (i * 0.01),  # GitHub results get a lower base score
                "metadata": {
                    "language": repo.get("language"),
                    "stars": repo.get("stargazers_count", 0),
                    "forks": repo.get("forks_count", 0),
                    "open_issues": repo.get("open_issues_count", 0),
                    "created_at": repo.get("created_at"),
                    "updated_at": repo.get("updated_at"),
                    "owner": repo.get("owner", {}).get("login", ""),
                    "license": repo.get("license", {}).get("name") if repo.get("license") else None
                }
            })
        
        return {
            "items": items,
            "total_results": data.get("total_count", 0)
        }
    
    def parse_basic_results(self, data: Dict, provider: str, query: str) -> Dict[str, Any]:
        """Basic result parser as a fallback"""
        return {
            "items": [],
            "total_results": 0,
            "error": f"No parser available for {provider}"
        }

# Create a singleton instance
search_service = SearchService()

# Initialize the service when this module is imported
async def init_search_service():
    """Initialize the search service"""
    await search_service.initialize()

# Clean up when the application shuts down
async def close_search_service():
    """Clean up the search service"""
    await search_service.cleanup()

# Export the service instance
__all__ = ["search_service", "init_search_service", "close_search_service"]
