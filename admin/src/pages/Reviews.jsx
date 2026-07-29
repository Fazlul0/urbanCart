import { useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReviews, hideReview, deleteReview } from '../services/api';

const Stars = ({ rating }) => (
  <span className="text-brand-gold text-xs">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
);

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getReviews({ limit: 50 });
      setReviews(res.data.reviews);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleHide = async (id) => {
    try {
      await hideReview(id);
      toast.success('Review visibility updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await deleteReview(id);
      toast.success('Review deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Reviews</h2>
        <p className="text-sm text-neutral-500">{reviews.length} reviews</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : reviews.length === 0 ? (
          <div className="card p-10 text-center text-neutral-500">No reviews yet</div>
        ) : (
          reviews.map((r) => (
            <div
              key={r._id}
              className={`card p-4 flex flex-wrap gap-4 justify-between ${
                r.isHidden ? 'opacity-60' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{r.user?.name}</p>
                  <Stars rating={r.rating} />
                  {r.isHidden && (
                    <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mb-2">
                  {r.product?.name} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-neutral-700">{r.comment}</p>
              </div>
              <div className="flex gap-2 items-start">
                <button
                  onClick={() => handleHide(r._id)}
                  className="btn-ghost py-1.5 px-2"
                  title={r.isHidden ? 'Show' : 'Hide'}
                >
                  {r.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(r._id)}
                  className="btn-ghost py-1.5 px-2 text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
