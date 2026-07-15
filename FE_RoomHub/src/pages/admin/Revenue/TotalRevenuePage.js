import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

import { Bar } from "react-chartjs-2";

import {
  DollarOutlined,
  HomeOutlined,
  ReloadOutlined,
  RiseOutlined,
  TransactionOutlined,
} from "@ant-design/icons";

import AdminLayout from "../../layout/admin/AdminLayout";

import {
  getTotalRevenue,
} from "../../../api/revenue";

import "./revenue.css";

ChartJS.register(
  BarElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatCompact = (value) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export default function TotalRevenuePage() {
  const currentYear =
    new Date().getFullYear();

  const [year, setYear] =
    useState(currentYear);

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const availableYears = useMemo(
    () =>
      Array.from(
        { length: 6 },
        (_, index) =>
          currentYear - index
      ),
    [currentYear]
  );

  const loadRevenue =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getTotalRevenue({
            year,
          });

        setData(
          response?.data || null
        );
      } catch (requestError) {
        console.error(
          "Load total revenue error:",
          requestError
        );

        setData(null);

        setError(
          requestError?.response?.data
            ?.message ||
            requestError?.message ||
            "Failed to load revenue"
        );
      } finally {
        setLoading(false);
      }
    }, [year]);

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  const summary = data?.summary || {};

  const monthlyRevenue =
    Array.isArray(data?.monthlyRevenue)
      ? data.monthlyRevenue
      : [];

  const chartData = useMemo(
    () => ({
      labels: MONTH_LABELS,

      datasets: [
        {
          type: "bar",
          label: "Deposit Income",

          data: MONTH_LABELS.map(
            (_, index) =>
              Number(
                monthlyRevenue[index]
                  ?.depositRevenue || 0
              )
          ),

          backgroundColor:
            "rgba(37, 99, 235, 0.78)",

          borderRadius: 6,
          maxBarThickness: 30,
        },

        {
          type: "bar",
          label: "Rental Income",

          data: MONTH_LABELS.map(
            (_, index) =>
              Number(
                monthlyRevenue[index]
                  ?.rentRevenue || 0
              )
          ),

          backgroundColor:
            "rgba(234, 88, 12, 0.78)",

          borderRadius: 6,
          maxBarThickness: 30,
        },

        {
          type: "line",
          label: "Net Revenue",

          data: MONTH_LABELS.map(
            (_, index) =>
              Number(
                monthlyRevenue[index]
                  ?.netRevenue || 0
              )
          ),

          borderColor:
            "rgb(22, 163, 74)",

          backgroundColor:
            "rgb(22, 163, 74)",

          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
        },
      ],
    }),
    [monthlyRevenue]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false,
      },

      plugins: {
        legend: {
          position: "top",
          align: "end",

          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },

        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${formatCurrency(
                context.raw
              )}`,
          },
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },
        },

        y: {
          beginAtZero: true,

          ticks: {
            callback: (value) =>
              formatCompact(value),
          },
        },
      },
    }),
    []
  );

  return (
    <AdminLayout>
      <main className="revenue-page">
        <header className="revenue-page-header">
          <div>
            <span className="revenue-page-eyebrow">
              RoomHub Finance
            </span>

            <h1>Revenue Dashboard</h1>

            <p>
              Overview of revenue generated
              across all boarding houses.
            </p>
          </div>

          <div className="revenue-header-actions">
            <select
              value={year}
              onChange={(event) =>
                setYear(
                  Number(
                    event.target.value
                  )
                )
              }
              className="revenue-select"
            >
              {availableYears.map(
                (yearOption) => (
                  <option
                    key={yearOption}
                    value={yearOption}
                  >
                    Reporting Year{" "}
                    {yearOption}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              className="revenue-refresh-button"
              onClick={loadRevenue}
              disabled={loading}
            >
              <ReloadOutlined />
              Generate Report
            </button>
          </div>
        </header>

        {loading && (
          <div className="revenue-state-card">
            <div className="revenue-spinner" />

            <p>
              Generating revenue report...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="revenue-state-card revenue-state-card--error">
            <h3>
              Unable to Load Revenue
            </h3>

            <p>{error}</p>

            <button
              type="button"
              className="revenue-button revenue-button--primary"
              onClick={loadRevenue}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <section className="revenue-summary-grid">
              <article className="revenue-summary-card revenue-summary-card--primary">
                <span>Total Revenue</span>

                <strong>
                  {formatCurrency(
                    summary.grossRevenue
                  )}
                </strong>

                <small>
                  Total income before refunds
                </small>
              </article>

              <article className="revenue-summary-card">
                <div className="revenue-summary-icon revenue-summary-icon--blue">
                  <DollarOutlined />
                </div>

                <span>Deposit Income</span>

                <strong>
                  {formatCurrency(
                    summary.depositRevenue
                  )}
                </strong>

                <small>
                  Security deposits received
                </small>
              </article>

              <article className="revenue-summary-card">
                <div className="revenue-summary-icon revenue-summary-icon--orange">
                  <TransactionOutlined />
                </div>

                <span>Rental Income</span>

                <strong>
                  {formatCurrency(
                    summary.rentRevenue
                  )}
                </strong>

                <small>
                  Monthly rent payments
                  received
                </small>
              </article>

              <article className="revenue-summary-card">
                <div className="revenue-summary-icon revenue-summary-icon--red">
                  <ReloadOutlined />
                </div>

                <span>Refunds</span>

                <strong>
                  {formatCurrency(
                    summary.refundAmount
                  )}
                </strong>

                <small>
                  Amount returned to tenants
                </small>
              </article>

              <article className="revenue-summary-card">
                <div className="revenue-summary-icon revenue-summary-icon--green">
                  <RiseOutlined />
                </div>

                <span>Net Revenue</span>

                <strong>
                  {formatCurrency(
                    summary.netRevenue
                  )}
                </strong>

                <small>
                  Revenue after deducting
                  refunds
                </small>
              </article>

              <article className="revenue-summary-card">
                <div className="revenue-summary-icon revenue-summary-icon--purple">
                  <HomeOutlined />
                </div>

                <span>Boarding Houses</span>

                <strong>
                  {summary.boardingHouseCount ||
                    0}
                </strong>

                <small>
                  Boarding houses with
                  recorded income
                </small>
              </article>
            </section>

            <section className="revenue-panel">
              <div className="revenue-panel-header">
                <div>
                  <h2>
                    Monthly Revenue Overview
                  </h2>

                  <p>
                    Compare deposit income,
                    rental income and net
                    revenue by month.
                  </p>
                </div>
              </div>

              <div className="revenue-main-chart">
                <Bar
                  data={chartData}
                  options={chartOptions}
                />
              </div>
            </section>

            <section className="revenue-panel">
              <div className="revenue-panel-header">
                <div>
                  <h2>
                    Monthly Revenue Summary
                  </h2>

                  <p>
                    Detailed financial
                    summary for each month
                    of {year}.
                  </p>
                </div>
              </div>

              <div className="revenue-table-wrapper">
                <table className="revenue-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>
                        Deposit Income
                      </th>
                      <th>
                        Rental Income
                      </th>
                      <th>Refunds</th>
                      <th>Net Revenue</th>
                    </tr>
                  </thead>

                  <tbody>
                    {MONTH_LABELS.map(
                      (monthLabel, index) => {
                        const item =
                          monthlyRevenue[index] ||
                          {
                            month: index + 1,
                            depositRevenue: 0,
                            rentRevenue: 0,
                            refundAmount: 0,
                            netRevenue: 0,
                          };

                        return (
                          <tr key={item.month}>
                            <td>{monthLabel}</td>

                            <td>
                              {formatCurrency(
                                item.depositRevenue
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                item.rentRevenue
                              )}
                            </td>

                            <td className="revenue-table-refund">
                              {formatCurrency(
                                item.refundAmount
                              )}
                            </td>

                            <td className="revenue-table-net">
                              {formatCurrency(
                                item.netRevenue
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </AdminLayout>
  );
}