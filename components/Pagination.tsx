const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// Shared slicing logic for every admin list that pairs client-side
// search/filter with this component — clamps to the last valid page (e.g.
// after a filter shrinks the result set) rather than showing an empty page.
export function paginate<T>(items: T[], page: number, pageSize: number): {
  safePage: number;
  totalPages: number;
  pageItems: T[];
} {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return { safePage, totalPages, pageItems: items.slice(start, start + pageSize) };
}

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
};

// Windowed page-number list — full run for small counts, first/last +
// current-neighborhood with ellipses once there are more pages than fit.
function pageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: Props) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination-bar">
      <span>
        Showing {start}–{end} of {totalItems}
      </span>

      {totalPages > 1 && (
        <div className="pagination-pages">
          <button type="button" className="tbl-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            ← Prev
          </button>
          {pageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="pagination-ellipsis">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`tbl-btn${p === page ? " active" : ""}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className="tbl-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
            Next →
          </button>
        </div>
      )}

      <label className="pagination-size">
        Rows per page
        <select className="rows-select" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
