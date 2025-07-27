"""
Search models for the Pilot Browser.

This module defines the Pydantic models and enums used for search functionality.
"""
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, HttpUrl, validator
from datetime import datetime

class SearchProvider(str, Enum):
    """Supported search providers"""
    GOOGLE = "google"
    BING = "bing"
    DUCKDUCKGO = "duckduckgo"
    REDDIT = "reddit"
    GITHUB = "github"
    TWITTER = "twitter"  # Placeholder for future implementation
    YOUTUBE = "youtube"  # Placeholder for future implementation
    WIKIPEDIA = "wikipedia"  # Placeholder for future implementation

class SearchResultType(str, Enum):
    """Types of search results"""
    WEB = "web"
    IMAGE = "image"
    VIDEO = "video"
    NEWS = "news"
    MAP = "map"
    SHOPPING = "shopping"
    BOOK = "book"
    RECIPE = "recipe"
    CODE = "code"
    DOCUMENT = "document"
    FORUM = "forum"
    SOCIAL = "social"
    OTHER = "other"

class SearchQuery(BaseModel):
    """Model for search query parameters"""
    query: str = Field(..., min_length=1, max_length=500, description="The search query")
    providers: Optional[List[SearchProvider]] = Field(
        None,
        description="List of search providers to use. If not provided, all available providers will be used."
    )
    limit: int = Field(
        10,
        ge=1,
        le=100,
        description="Maximum number of results to return per provider"
    )
    offset: int = Field(
        0,
        ge=0,
        description="Offset for pagination"
    )
    safe_search: bool = Field(
        True,
        description="Whether to enable safe search filtering"
    )
    region: Optional[str] = Field(
        "us",
        min_length=2,
        max_length=5,
        description="Region code for localized results (e.g., 'us', 'uk', 'fr')"
    )
    language: Optional[str] = Field(
        "en",
        min_length=2,
        max_length=10,
        description="Language code for results (e.g., 'en', 'es', 'fr')"
    )
    result_types: Optional[List[SearchResultType]] = Field(
        None,
        description="Filter results by type (web, image, video, etc.)"
    )
    filters: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional filters specific to certain providers"
    )

class SearchResult(BaseModel):
    """Model for a single search result"""
    title: str = Field(..., description="Title of the search result")
    url: HttpUrl = Field(..., description="URL of the search result")
    snippet: Optional[str] = Field(None, description="Short description or preview of the result")
    provider: str = Field(..., description="Name of the search provider that returned this result")
    result_type: SearchResultType = Field(
        SearchResultType.WEB,
        description="Type of the search result"
    )
    score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Relevance score of the result (0.0 to 1.0)"
    )
    published_at: Optional[datetime] = Field(
        None,
        description="Publication or last modification date of the result"
    )
    image_url: Optional[HttpUrl] = Field(
        None,
        description="URL of a thumbnail or preview image"
    )
    favicon_url: Optional[HttpUrl] = Field(
        None,
        description="URL of the website's favicon"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata specific to the result type or provider"
    )

class SearchResponse(BaseModel):
    """Model for the search API response"""
    query: str = Field(..., description="The original search query")
    total_results: int = Field(..., ge=0, description="Total number of results found")
    page: int = Field(1, ge=1, description="Current page number")
    page_size: int = Field(10, ge=1, le=100, description="Number of results per page")
    results: List[SearchResult] = Field(..., description="List of search results")
    suggested_queries: Optional[List[str]] = Field(
        None,
        description="List of suggested alternative queries"
    )
    related_searches: Optional[List[str]] = Field(
        None,
        description="List of related search queries"
    )
    spelling_suggestion: Optional[str] = Field(
        None,
        description="Spelling correction suggestion, if applicable"
    )
    providers_used: List[str] = Field(
        ...,
        description="List of search providers that were queried"
    )
    provider_errors: Optional[Dict[str, str]] = Field(
        None,
        description="Any errors that occurred with specific providers"
    )
    execution_time_ms: Optional[float] = Field(
        None,
        ge=0,
        description="Time taken to execute the search in milliseconds"
    )

class SearchSuggestion(BaseModel):
    """Model for search suggestions"""
    query: str = Field(..., description="The suggested search query")
    type: str = Field("suggestion", description="Type of suggestion")
    relevance: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Relevance score of the suggestion (0.0 to 1.0)"
    )
    source: Optional[str] = Field(
        None,
        description="Source of the suggestion (e.g., 'popular', 'history', 'spelling')"
    )

class SearchHistoryItem(BaseModel):
    """Model for search history items"""
    query: str = Field(..., description="The search query")
    timestamp: datetime = Field(..., description="When the search was performed")
    result_count: Optional[int] = Field(
        None,
        ge=0,
        description="Number of results returned"
    )
    filters: Optional[Dict[str, Any]] = Field(
        None,
        description="Any filters that were applied to the search"
    )

class SearchFilter(BaseModel):
    """Model for search filters"""
    name: str = Field(..., description="Name of the filter")
    display_name: str = Field(..., description="User-friendly display name")
    type: str = Field(..., description="Type of filter (e.g., 'select', 'range', 'date', 'boolean')")
    options: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Available options for select/multi-select filters"
    )
    min: Optional[float] = Field(
        None,
        description="Minimum value for range filters"
    )
    max: Optional[float] = Field(
        None,
        description="Maximum value for range filters"
    )
    default: Optional[Any] = Field(
        None,
        description="Default value for the filter"
    )
    multiple: bool = Field(
        False,
        description="Whether multiple values can be selected"
    )
    required: bool = Field(
        False,
        description="Whether the filter is required"
    )

class SearchProviderInfo(BaseModel):
    """Model for search provider information"""
    id: str = Field(..., description="Unique identifier for the provider")
    name: str = Field(..., description="Display name of the provider")
    description: Optional[str] = Field(
        None,
        description="Description of the provider"
    )
    icon_url: Optional[HttpUrl] = Field(
        None,
        description="URL of the provider's icon"
    )
    website: Optional[HttpUrl] = Field(
        None,
        description="URL of the provider's website"
    )
    supports_safe_search: bool = Field(
        False,
        description="Whether the provider supports safe search filtering"
    )
    supports_region: bool = Field(
        False,
        description="Whether the provider supports region-specific results"
    )
    supports_language: bool = Field(
        False,
        description="Whether the provider supports language-specific results"
    )
    supported_result_types: List[SearchResultType] = Field(
        [SearchResultType.WEB],
        description="List of supported result types"
    )
    filters: Optional[List[SearchFilter]] = Field(
        None,
        description="List of supported filters"
    )
    is_default: bool = Field(
        False,
        description="Whether this is a default provider"
    )
    is_enabled: bool = Field(
        True,
        description="Whether this provider is enabled"
    )
    rate_limit: Optional[Dict[str, int]] = Field(
        None,
        description="Rate limiting information (requests per minute, etc.)"
    )
    auth_required: bool = Field(
        False,
        description="Whether authentication is required to use this provider"
    )
    auth_type: Optional[str] = Field(
        None,
        description="Type of authentication required (e.g., 'api_key', 'oauth2')"
    )
    config: Optional[Dict[str, Any]] = Field(
        None,
        description="Provider-specific configuration"
    )

# Example usage in the API:
# @router.get("/search", response_model=SearchResponse)
# async def search(query: str, limit: int = 10, offset: int = 0):
#     # Implementation here
#     pass
