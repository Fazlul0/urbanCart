import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Filter, X, Search, Loader2 } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { getProducts, getCategories } from '../services/api';
import { debounce } from '../utils/helpers';

const PAGE_SIZE = 12;

const Products = ({ productType = 'general' }) => {
  const isFood = productType === 'food';
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || 'newest',
    freeDelivery: searchParams.get('freeDelivery') || '',
  };

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const buildParams = useCallback(
    (page) => {
      const params = {
        page,
        limit: PAGE_SIZE,
        sort: filters.sort,
        type: productType,
      };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.availability) params.availability = filters.availability;
      if (filters.freeDelivery === 'true') params.freeDelivery = 'true';
      return params;
    },
    [
      productType,
      filters.sort,
      filters.search,
      filters.category,
      filters.minPrice,
      filters.maxPrice,
      filters.availability,
      filters.freeDelivery,
    ]
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts(buildParams(1));
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      setProducts([]);
      setPagination({ page: 1, pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current) return;
    if (pagination.page >= pagination.pages) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const res = await getProducts(buildParams(nextPage));
      const next = res.data.products || [];
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        return [...prev, ...next.filter((p) => !seen.has(p._id))];
      });
      setPagination(res.data.pagination || { page: nextPage, pages: pagination.pages, total: pagination.total });
    } catch {
      /* keep current list */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [buildParams, loading, pagination.page, pagination.pages, pagination.total]);

  useEffect(() => {
    getCategories({ type: productType })
      .then((res) => setCategories(res.data.categories))
      .catch(() => {});
  }, [productType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading) return undefined;
    if (pagination.page >= pagination.pages) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: '280px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, loading, pagination.page, pagination.pages]);

  const onSearchChange = debounce((value) => updateFilter('search', value), 400);

  const activeCategory = categories.find((c) => c._id === filters.category);
  const pageTitle = activeCategory
    ? activeCategory.name
    : isFood
      ? 'Food Market'
      : 'Shop All';

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Search</label>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted"
          />
          <input
            type="search"
            defaultValue={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-brand-border bg-white py-2.5 pl-10 pr-4 text-sm text-brand-black placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold transition"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="input-field py-2.5 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Price Range (BDT)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="input-field py-2.5 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="input-field py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Availability</label>
        <select
          value={filters.availability}
          onChange={(e) => updateFilter('availability', e.target.value)}
          className="input-field py-2.5 text-sm"
        >
          <option value="">All</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="preorder">Pre-order</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.freeDelivery === 'true'}
          onChange={(e) => updateFilter('freeDelivery', e.target.checked ? 'true' : '')}
        />
        Free delivery only
      </label>

      <div>
        <label className="text-sm font-medium mb-2 block">Sort By</label>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="input-field py-2.5 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="bestselling">Best Selling</option>
        </select>
      </div>

      <button
        onClick={() => setSearchParams({})}
        className="text-sm text-brand-muted hover:text-brand-gold transition"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle} — Nogor Car</title>
      </Helmet>

      <div className="pt-6 pb-16 w-full min-w-0 overflow-x-hidden">
        <div className="container-uc px-3 sm:px-6 lg:px-8 w-full min-w-0">
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl mb-2">{pageTitle}</h1>
            <p className="text-brand-muted">
              {pagination.total} {isFood ? 'item' : 'product'}
              {pagination.total !== 1 ? 's' : ''} found
              {activeCategory ? ` in ${activeCategory.name}` : ''}
              {isFood && !activeCategory ? ' · Order by piece or weight' : ''}
            </p>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => updateFilter('category', '')}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition ${
                    !filters.category
                      ? 'bg-brand-gold border-brand-gold text-brand-black font-medium'
                      : 'border-brand-border text-brand-muted hover:border-brand-gold'
                  }`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => updateFilter('category', c._id)}
                    className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition ${
                      filters.category === c._id
                        ? 'bg-brand-gold border-brand-gold text-brand-black font-medium'
                        : 'border-brand-border text-brand-muted hover:border-brand-gold'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-28 bg-white rounded-2xl border border-brand-border p-5">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Filter size={16} /> Filters
                </h3>
                <FilterPanel />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="btn-outline py-2 text-sm"
                >
                  <Filter size={16} /> Filters
                </button>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="input-field py-2 text-sm w-auto"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="bestselling">Best Selling</option>
                </select>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-brand-border">
                  <p className="text-brand-muted text-lg mb-4">No products found</p>
                  <button onClick={() => setSearchParams({})} className="btn-primary">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
                    {products.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                  <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
                    {loadingMore ? (
                      <Loader2 size={18} className="animate-spin text-brand-muted" aria-label="Loading more" />
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white p-6 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
