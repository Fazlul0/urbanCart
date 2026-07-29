import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Filter, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { getProducts, getCategories } from '../services/api';
import { debounce } from '../utils/helpers';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') || '1',
  };

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: 12,
        sort: filters.sort,
      };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.availability) params.availability = filters.availability;

      const res = await getProducts(params);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    filters.page,
    filters.sort,
    filters.search,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.availability,
  ]);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onSearchChange = debounce((value) => updateFilter('search', value), 400);

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
        <title>Shop — UrbanCart</title>
      </Helmet>

      <div className="pt-28 pb-16">
        <div className="container-uc px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl mb-2">Shop All</h1>
            <p className="text-brand-muted">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="flex gap-8">
            {/* Desktop filters */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => updateFilter('page', String(pagination.page - 1))}
                    className="p-2 rounded-lg border border-brand-border disabled:opacity-40 hover:bg-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === pagination.pages ||
                        Math.abs(p - pagination.page) <= 1
                    )
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-1 text-brand-muted">…</span>
                        )}
                        <button
                          onClick={() => updateFilter('page', String(p))}
                          className={`w-10 h-10 rounded-lg text-sm font-medium ${
                            p === pagination.page
                              ? 'bg-brand-gold text-brand-black'
                              : 'border border-brand-border hover:bg-white'
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => updateFilter('page', String(pagination.page + 1))}
                    className="p-2 rounded-lg border border-brand-border disabled:opacity-40 hover:bg-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
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
