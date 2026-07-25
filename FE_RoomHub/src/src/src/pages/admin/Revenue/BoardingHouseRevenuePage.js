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
  getBoardingHouseMonthlyRevenue,
  getRevenueBoardingHouseOptions,
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

const getAddressPart = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.name || value.fullName || "";
};

const formatAddress = (address) => {
  if (!address) {
    return "Address is not available";
  }

  if (typeof address === "string") {
    return address;
  }

  return [
    address.detail,
    address.street,
    getAddressPart(address.ward),
    getAddressPart(address.district),
    getAddressPart(address.province),
    getAddressPart(address.city),
  ]
    .filter(Boolean)
    .join(", ");
};

export default function BoardingHouseRevenuePage() {
  const currentYear = new Date().getFullYear();

  const [boardingHouses, setBoardingHouses] =
    useState([]);

  const [
    selectedBoardingHouseId,
    setSelectedBoardingHouseId,
  ] = useState("");

  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [loadingRevenue, setLoadingRevenue] =
    useState(false);

  const [optionsError, setOptionsError] =
    useState("");

  const [revenueError, setRevenueError] =
    useState("");

  const availableYears = useMemo(
    () =>
      Array.from(
        { length: 6 },
        (_, index) => currentYear - index
      ),
    [currentYear]
  );

  const loadBoardingHouses = useCallback(
    async () => {
      try {
        setLoadingOptions(true);
        setOptionsError("");

        const response =
          await getRevenueBoardingHouseOptions();

        const boardingHouseList =
          Array.isArray(response?.data)
            ? response.data
            : [];

        setBoardingHouses(
          boardingHouseList
        );

        if (
          boardingHouseList.length === 0
        ) {
          setSelectedBoardingHouseId("");
          setData(null);
          return;
        }

        setSelectedBoardingHouseId(
          (currentId) => {
            const currentStillExists =
              boardingHouseList.some(
                (item) =>
                  item._id === currentId
              );

            return currentStillExists
              ? currentId
              : boardingHouseList[0]._id;
          }
        );
      } catch (requestError) {
        console.error(
          "Load boarding houses error:",
          requestError
        );

        setBoardingHouses([]);
        setSelectedBoardingHouseId("");
        setData(null);

        setOptionsError(
          requestError?.response?.data
            ?.message ||
            requestError?.message ||
            "Failed to load boarding houses"
        );
      } finally {
        setLoadingOptions(false);
      }
    },
    []
  );

  useEffect(() => {
    loadBoardingHouses();
  }, [loadBoardingHouses]);

  const loadRevenue = useCallback(
    async () => {
      if (!selectedBoardingHouseId) {
        setData(null);
        return;
      }

      try {
        setLoadingRevenue(true);
        setRevenueError("");

        const response =
          await getBoardingHouseMonthlyRevenue(
            selectedBoardingHouseId,
            { year }
          );

        setData(response?.data || null);
      } catch (requestError) {
        console.error(
          "Load boarding house revenue error:",
          requestError
        );

        setData(null);

        setRevenueError(
          requestError?.response?.data
            ?.message ||
            requestError?.message ||
            "Failed to load boarding house revenue"
        );
      } finally {
        setLoadingRevenue(false);
      }
    },
    [selectedBoardingHouseId, year]
  );

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  const summary = data?.summary || {};

  const monthlyRevenue =
    Array.isArray(data?.monthlyRevenue)
      ? data.monthlyRevenue
      : [];

  const boardingHouse =
    data?.boardingHouse || null;

  const selectedOption =
    boardingHouses.find(
      (item) =>
        item._id ===
        selectedBoardingHouseId
    ) || null;

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

            <h1>
              Boarding House Revenue
            </h1>

            <p>
              View the financial performance
              of an individual boarding house.
            </p>
          </div>
        </header>

        <section className="revenue-selector-panel">
          <div className="revenue-selector-field revenue-selector-field--house">
            <label htmlFor="boarding-house-select">
              Select Boarding House
            </label>

            <select
              id="boarding-house-select"
              value={
                selectedBoardingHouseId
              }
              onChange={(event) =>
                setSelectedBoardingHouseId(
                  event.target.value
                )
              }
              disabled={
                loadingOptions ||
                boardingHouses.length === 0
              }
              className="revenue-select"
            >
              {loadingOptions && (
                <option value="">
                  Loading boarding houses...
                </option>
              )}

              {!loadingOptions &&
                boardingHouses.length ===
                  0 && (
                  <option value="">
                    No boarding house found
                  </option>
                )}

              {!loadingOptions &&
                boardingHouses.map(
                  (item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {item.name ||
                        "Unnamed boarding house"}
                    </option>
                  )
                )}
            </select>
          </div>

          <div className="revenue-selector-field">
            <label htmlFor="revenue-year-select">
              Reporting Year
            </label>

            <select
              id="revenue-year-select"
              value={year}
              onChange={(event) =>
                setYear(
                  Number(
                    event.target.value
                  )
                )
              }
              className="revenue-select"
              disabled={
                loadingOptions ||
                boardingHouses.length === 0
              }
            >
              {availableYears.map(
                (yearOption) => (
                  <option
                    key={yearOption}
                    value={yearOption}
                  >
                    {yearOption}
                  </option>
                )
              )}
            </select>
          </div>

          <button
            type="button"
            className="revenue-refresh-button"
            onClick={loadRevenue}
            disabled={
              loadingOptions ||
              loadingRevenue ||
              !selectedBoardingHouseId
            }
          >
            <ReloadOutlined />
            Generate Report
          </button>
        </section>

        {!loadingOptions &&
          optionsError && (
            <section className="revenue-state-card revenue-state-card--error">
              <h3>
                Unable to load boarding
                houses
              </h3>

              <p>{optionsError}</p>

              <button
                type="button"
                className="revenue-button revenue-button--primary"
                onClick={
                  loadBoardingHouses
                }
              >
                Try Again
              </button>
            </section>
          )}

        {loadingOptions && (
          <section className="revenue-state-card">
            <div className="revenue-spinner" />

            <p>
              Loading boarding houses...
            </p>
          </section>
        )}

        {!loadingOptions &&
          !optionsError &&
          boardingHouses.length === 0 && (
            <section className="revenue-state-card">
              <HomeOutlined className="revenue-empty-icon" />

              <h3>
                No Boarding House Found
              </h3>

              <p>
                There is currently no
                boarding house available
                for revenue reporting.
              </p>
            </section>
          )}

        {!loadingOptions &&
          !optionsError &&
          boardingHouses.length > 0 &&
          loadingRevenue && (
            <section className="revenue-state-card">
              <div className="revenue-spinner" />

              <p>
                Generating revenue report...
              </p>
            </section>
          )}

        {!loadingRevenue &&
          revenueError && (
            <section className="revenue-state-card revenue-state-card--error">
              <h3>
                Unable to Load Revenue
              </h3>

              <p>{revenueError}</p>

              <button
                type="button"
                className="revenue-button revenue-button--primary"
                onClick={loadRevenue}
              >
                Try Again
              </button>
            </section>
          )}

        {!loadingOptions &&
          !loadingRevenue &&
          !optionsError &&
          !revenueError &&
          data && (
            <>
              <section className="revenue-house-overview">
                <div className="revenue-house-logo">
                  <HomeOutlined />
                </div>

                <div>
                  <h2>
                    {boardingHouse?.name ||
                      selectedOption?.name ||
                      "Boarding house"}
                  </h2>

                  <p>
                    {formatAddress(
                      boardingHouse?.address ||
                        selectedOption?.address
                    )}
                  </p>
                </div>

                <span>
                  Report for {year}
                </span>
              </section>

              <section className="revenue-summary-grid">
                <article className="revenue-summary-card revenue-summary-card--primary">
                  <span>Total Revenue</span>

                  <strong>
                    {formatCurrency(
                      summary.grossRevenue
                    )}
                  </strong>

                  <small>
                    Total income before
                    refunds
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
                            monthlyRevenue[
                              index
                            ] || {
                              month:
                                index + 1,
                              depositRevenue: 0,
                              rentRevenue: 0,
                              refundAmount: 0,
                              netRevenue: 0,
                            };

                          return (
                            <tr
                              key={
                                item.month
                              }
                            >
                              <td>
                                {monthLabel}
                              </td>

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