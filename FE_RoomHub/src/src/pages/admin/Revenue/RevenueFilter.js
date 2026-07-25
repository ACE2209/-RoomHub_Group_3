import { useEffect, useState } from "react";

export default function RevenueFilter({
  onFilter,
  loading = false,
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
  }, [fromDate, toDate]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      fromDate &&
      toDate &&
      new Date(fromDate) > new Date(toDate)
    ) {
      setError(
        "From date must be earlier than or equal to To date."
      );
      return;
    }

    onFilter({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setError("");
    onFilter({});
  };

  return (
    <div className="revenue-filter-card">
      <div className="revenue-filter-heading">
        <div>
          <h3>Revenue filter</h3>
          <p>
            Select a period to view RoomHub revenue.
          </p>
        </div>
      </div>

      <form
        className="revenue-filter-form"
        onSubmit={handleSubmit}
      >
        <div className="revenue-filter-field">
          <label htmlFor="revenue-from-date">
            From date
          </label>

          <input
            id="revenue-from-date"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) =>
              setFromDate(event.target.value)
            }
          />
        </div>

        <div className="revenue-filter-field">
          <label htmlFor="revenue-to-date">
            To date
          </label>

          <input
            id="revenue-to-date"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) =>
              setToDate(event.target.value)
            }
          />
        </div>

        <div className="revenue-filter-actions">
          <button
            type="submit"
            className="revenue-button revenue-button--primary"
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply filter"}
          </button>

          <button
            type="button"
            className="revenue-button revenue-button--secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="revenue-filter-error">
          {error}
        </div>
      )}
    </div>
  );
}