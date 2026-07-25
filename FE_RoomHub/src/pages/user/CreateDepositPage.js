import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Home,
  Info,
  Loader2,
  LogIn,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { getImageSource, setFallbackImage } from "../../api/config";
import { createDepositRequest } from "../../api/deposit";
import { getRoomDetails } from "../../api/room";
import { getStoredUser, normalizeRole } from "../../utils/roleNavigation";
import Footer from "../layout/homepage/footer";
import Header from "../layout/homepage/header";
import "./CreateDepositPage.css";

const RENTAL_OPTIONS = [1, 3, 6, 12];
const DEPOSIT_OPTIONS = [1, 2];
const NOTE_LIMIT = 500;

const pad2 = (value) => String(value).padStart(2, "0");

const getLocalDateInputValue = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseLocalDate = (value) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addAnchoredMonths = (startDate, monthsToAdd) => {
  const source = new Date(startDate);
  const anchorDay = source.getDate();

  const target = new Date(
    source.getFullYear(),
    source.getMonth() + Number(monthsToAdd || 0),
    1,
    0,
    0,
    0,
    0
  );

  const lastDayOfTargetMonth = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();

  target.setDate(Math.min(anchorDay, lastDayOfTargetMonth));
  return target;
};

const calculateRentalEnd = (startDateValue, rentalMonths) => {
  const start = parseLocalDate(startDateValue);
  if (!start) return null;

  const nextCycleStart = addAnchoredMonths(start, rentalMonths);
  return new Date(nextCycleStart.getTime() - 1000);
};

const formatDateTime = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "Auto calculated";

  return `${pad2(date.getDate())}/${pad2(
    date.getMonth() + 1
  )}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}:${pad2(date.getSeconds())}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatAddress = (address) => {
  if (!address) return "Address is being updated";
  if (typeof address === "string") return address;

  return [
    address.detail,
    address.ward?.name || address.ward,
    address.district?.name || address.district,
    address.province?.name || address.province,
  ]
    .filter(Boolean)
    .join(", ");
};

const getAuthSession = () => {
  const token = localStorage.getItem("token");
  const storedUser = getStoredUser();

  if (!token) {
    return { isAuthenticated: false, role: "", user: storedUser };
  }

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded?.exp && decoded.exp * 1000 <= Date.now();

    if (isExpired) {
      return { isAuthenticated: false, role: "", user: storedUser };
    }

    const decodedRole =
      decoded?.role ||
      decoded?.Role ||
      decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    return {
      isAuthenticated: true,
      role: normalizeRole(storedUser?.role || storedUser?.Role || decodedRole),
      user: storedUser,
    };
  } catch (error) {
    return { isAuthenticated: false, role: "", user: storedUser };
  }
};

const getDraftKey = (roomId) => `roomhub:create-deposit:${roomId || "unknown"}`;

const CreateDepositPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [rentalTime, setRentalTime] = useState(6);
  const [depositMonths, setDepositMonths] = useState(1);
  const [note, setNote] = useState("");
  const [draftReady, setDraftReady] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const authSession = getAuthSession();

  useEffect(() => {
    const draftKey = getDraftKey(roomId);

    try {
      const rawDraft = sessionStorage.getItem(draftKey);
      const draft = rawDraft ? JSON.parse(rawDraft) : null;

      if (draft) {
        setStartDate(typeof draft.startDate === "string" ? draft.startDate : "");
        setRentalTime(
          RENTAL_OPTIONS.includes(Number(draft.rentalTime))
            ? Number(draft.rentalTime)
            : 6
        );
        setDepositMonths(
          DEPOSIT_OPTIONS.includes(Number(draft.depositMonths))
            ? Number(draft.depositMonths)
            : 1
        );
        setNote(typeof draft.note === "string" ? draft.note.slice(0, NOTE_LIMIT) : "");
      }
    } catch (error) {
      sessionStorage.removeItem(draftKey);
    } finally {
      setDraftReady(true);
    }
  }, [roomId]);

  useEffect(() => {
    if (!draftReady || !roomId) return;

    sessionStorage.setItem(
      getDraftKey(roomId),
      JSON.stringify({
        startDate,
        rentalTime: Number(rentalTime),
        depositMonths: Number(depositMonths),
        note,
      })
    );
  }, [depositMonths, draftReady, note, rentalTime, roomId, startDate]);

  useEffect(() => {
    let isActive = true;

    const loadRoom = async () => {
      if (!roomId) {
        setRoomLoading(false);
        setRoomError("Room information is missing.");
        return;
      }

      try {
        setRoomLoading(true);
        setRoomError("");

        const response = await getRoomDetails(roomId);
        const roomData = response?.data || response;

        if (!isActive) return;

        if (!roomData?._id) {
          setRoom(null);
          setRoomError("The room could not be found or is no longer available.");
          return;
        }

        setRoom(roomData);
      } catch (error) {
        if (!isActive) return;

        setRoom(null);
        setRoomError(
          error?.message || "Unable to load room information. Please try again."
        );
      } finally {
        if (isActive) setRoomLoading(false);
      }
    };

    loadRoom();

    return () => {
      isActive = false;
    };
  }, [roomId]);

  const roomType =
    room?.roomTypeId && typeof room.roomTypeId === "object"
      ? room.roomTypeId
      : null;

  const boardingHouse =
    room?.boardingHouseId && typeof room.boardingHouseId === "object"
      ? room.boardingHouseId
      : null;

  const roomPrice = Number(roomType?.price || 0);
  const requiredDeposit = roomPrice * Number(depositMonths || 0);
  const rentalEnd = useMemo(
    () => calculateRentalEnd(startDate, rentalTime),
    [rentalTime, startDate]
  );

  const isDormitory = Boolean(
    room?.isDormitory || Number(roomType?.peopleNumber || 0) > 1
  );
  const availableSlots = Number(room?.availableSlots);
  const hasAcceptedDeposit =
    room?.hasAcceptedDeposit ||
    String(room?.depositStatus || "").toLowerCase() === "accepted";

  const roomUnavailable = room
    ? room.isAvailable === false ||
      (!isDormitory && hasAcceptedDeposit) ||
      (isDormitory && Number.isFinite(availableSlots) && availableSlots <= 0)
    : true;

  const roomStatusLabel = roomUnavailable
    ? "Not available"
    : isDormitory && Number.isFinite(availableSlots)
    ? `${availableSlots} slot${availableSlots === 1 ? "" : "s"} available`
    : "Available";

  const clearFieldError = (fieldName) => {
    setFieldErrors((current) => {
      if (!current[fieldName]) return current;

      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!roomId || !room?._id) {
      nextErrors.room = "Room information is required.";
    }

    if (roomUnavailable) {
      nextErrors.room = "This room is currently unavailable for deposit.";
    }

    if (!startDate) {
      nextErrors.startDate = "Please select the contract start date.";
    } else if (startDate < getLocalDateInputValue()) {
      nextErrors.startDate = "The start date cannot be earlier than today.";
    }

    if (!RENTAL_OPTIONS.includes(Number(rentalTime))) {
      nextErrors.rentalTime = "Please select a valid rental duration.";
    }

    if (!DEPOSIT_OPTIONS.includes(Number(depositMonths))) {
      nextErrors.depositMonths = "Please select a valid deposit period.";
    }

    if (!roomPrice || roomPrice <= 0) {
      nextErrors.roomPrice = "The room price is invalid. Please contact the owner.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBack = () => {
    if (roomId) {
      navigate(`/rooms/${roomId}`);
      return;
    }

    navigate(-1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    if (!authSession.isAuthenticated) {
      sessionStorage.setItem(
        getDraftKey(roomId),
        JSON.stringify({
          startDate,
          rentalTime: Number(rentalTime),
          depositMonths: Number(depositMonths),
          note,
        })
      );

      navigate("/login", {
        state: {
          from: location.pathname,
          notice: "Log in to submit your deposit request. Your form has been saved.",
        },
      });
      return;
    }

    if (authSession.role !== "user") {
      setSubmitError(
        "Only tenant accounts can submit a deposit request. Please use a tenant account."
      );
      return;
    }

    try {
      setSubmitting(true);

      await createDepositRequest({
        roomId,
        rentalTime: Number(rentalTime),
        depositMonths: Number(depositMonths),
        startDate,
        note: note.trim(),
      });

      sessionStorage.removeItem(getDraftKey(roomId));
      setSubmitted(true);

      window.setTimeout(() => {
        navigate("/my-deposits", { replace: true });
      }, 900);
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          "The deposit request could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <main className="deposit-create-page">
        <div className="deposit-create-shell">
          <button
            type="button"
            className="deposit-create-back"
            onClick={handleBack}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to room details
          </button>

          <header className="deposit-create-header">
            <div>
              <p className="deposit-create-eyebrow">RoomHub deposit</p>
              <h1>Create deposit request</h1>
              <p>
                Review the selected room, choose the rental period, and confirm
                the required deposit before sending your request.
              </p>
            </div>
            <span className="deposit-create-step">Request only · Pay after approval</span>
          </header>

          {!authSession.isAuthenticated && !roomLoading && !roomError && (
            <div className="deposit-login-note" role="status">
              <LogIn size={20} aria-hidden="true" />
              <div>
                <strong>You can complete the form before logging in.</strong>
                <p>
                  Login is requested only when you press “Log in and submit”.
                  Your entered information will be kept.
                </p>
              </div>
            </div>
          )}

          {roomLoading ? (
            <section className="deposit-create-state" aria-live="polite">
              <Loader2 className="deposit-spin" size={36} aria-hidden="true" />
              <h2>Loading room information</h2>
              <p>Please wait while RoomHub prepares your deposit request.</p>
            </section>
          ) : roomError ? (
            <section className="deposit-create-state deposit-create-state--error">
              <AlertCircle size={38} aria-hidden="true" />
              <h2>Cannot create this deposit request</h2>
              <p>{roomError}</p>
              <button
                type="button"
                className="deposit-button deposit-button--secondary"
                onClick={handleBack}
              >
                Return to room details
              </button>
            </section>
          ) : submitted ? (
            <section className="deposit-create-state deposit-create-state--success">
              <CheckCircle2 size={42} aria-hidden="true" />
              <h2>Deposit request submitted</h2>
              <p>
                Your request is pending owner approval. You will be redirected
                to My Deposits.
              </p>
            </section>
          ) : (
            <div className="deposit-create-grid">
              <aside className="deposit-room-card" aria-label="Selected room">
                <div className="deposit-room-card__visual">
                  <img
                    src={getImageSource(room?.images || room?.image)}
                    alt={`Room ${room?.roomNumber || "selected"}`}
                    onError={setFallbackImage}
                  />
                </div>

                <div className="deposit-room-card__body">
                  <p className="deposit-room-card__label">Selected room</p>
                  <div className="deposit-room-card__title-row">
                    <h2>Room {room?.roomNumber || "N/A"}</h2>
                    <span
                      className={`deposit-room-status ${
                        roomUnavailable
                          ? "deposit-room-status--unavailable"
                          : "deposit-room-status--available"
                      }`}
                    >
                      {roomStatusLabel}
                    </span>
                  </div>

                  <p className="deposit-room-card__house">
                    <Home size={16} aria-hidden="true" />
                    {boardingHouse?.name || "Boarding house"}
                  </p>
                  <p className="deposit-room-card__address">
                    <MapPin size={16} aria-hidden="true" />
                    {formatAddress(boardingHouse?.address)}
                  </p>

                  <dl className="deposit-room-facts">
                    <div>
                      <dt>
                        <BedDouble size={16} aria-hidden="true" /> Room type
                      </dt>
                      <dd>{roomType?.typeName || "N/A"}</dd>
                    </div>
                    <div>
                      <dt>
                        <Users size={16} aria-hidden="true" /> Capacity
                      </dt>
                      <dd>
                        {Number(roomType?.peopleNumber || 0) || "N/A"}
                        {Number(roomType?.peopleNumber || 0) ? " people" : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>Monthly price</dt>
                      <dd>{formatCurrency(roomPrice)}</dd>
                    </div>
                  </dl>
                </div>
              </aside>

              <form className="deposit-form-card" onSubmit={handleSubmit} noValidate>
                <section className="deposit-form-section">
                  <div className="deposit-section-heading">
                    <CalendarDays size={21} aria-hidden="true" />
                    <div>
                      <h2>Rental information</h2>
                      <p>Fields marked with * are required.</p>
                    </div>
                  </div>

                  <div className="deposit-form-fields">
                    <div className="deposit-field deposit-field-full">
                      <label htmlFor="deposit-room">Room</label>
                      <input
                        id="deposit-room"
                        className="deposit-input deposit-input--readonly"
                        value={`Room ${room?.roomNumber || "N/A"}`}
                        readOnly
                        aria-invalid={Boolean(fieldErrors.room)}
                      />
                      {fieldErrors.room && (
                        <p className="deposit-field-error">{fieldErrors.room}</p>
                      )}
                    </div>

                    <div className="deposit-field">
                      <label htmlFor="deposit-start-date">
                        Start date <span aria-hidden="true">*</span>
                      </label>
                      <input
                        id="deposit-start-date"
                        type="date"
                        className="deposit-input"
                        min={getLocalDateInputValue()}
                        value={startDate}
                        onChange={(event) => {
                          setStartDate(event.target.value);
                          clearFieldError("startDate");
                        }}
                        aria-invalid={Boolean(fieldErrors.startDate)}
                        aria-describedby={
                          fieldErrors.startDate ? "deposit-start-error" : undefined
                        }
                      />
                      {fieldErrors.startDate && (
                        <p id="deposit-start-error" className="deposit-field-error">
                          {fieldErrors.startDate}
                        </p>
                      )}
                    </div>

                    <div className="deposit-field">
                      <label htmlFor="deposit-rental-time">
                        Rental time <span aria-hidden="true">*</span>
                      </label>
                      <select
                        id="deposit-rental-time"
                        className="deposit-select"
                        value={rentalTime}
                        onChange={(event) => {
                          setRentalTime(Number(event.target.value));
                          clearFieldError("rentalTime");
                        }}
                        aria-invalid={Boolean(fieldErrors.rentalTime)}
                      >
                        {RENTAL_OPTIONS.map((month) => (
                          <option key={month} value={month}>
                            {month} month{month === 1 ? "" : "s"}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.rentalTime && (
                        <p className="deposit-field-error">
                          {fieldErrors.rentalTime}
                        </p>
                      )}
                    </div>

                    <div className="deposit-field deposit-field-full">
                      <label htmlFor="deposit-end-date">End date</label>
                      <input
                        id="deposit-end-date"
                        className="deposit-input deposit-input--readonly"
                        value={formatDateTime(rentalEnd)}
                        readOnly
                      />
                      <p className="deposit-field-help">
                        The rental period ends at 23:59:59 on the displayed date.
                      </p>
                    </div>

                    <div className="deposit-field deposit-field-full">
                      <label htmlFor="deposit-months">
                        Deposit months <span aria-hidden="true">*</span>
                      </label>
                      <select
                        id="deposit-months"
                        className="deposit-select"
                        value={depositMonths}
                        onChange={(event) => {
                          setDepositMonths(Number(event.target.value));
                          clearFieldError("depositMonths");
                        }}
                        aria-invalid={Boolean(fieldErrors.depositMonths)}
                      >
                        {DEPOSIT_OPTIONS.map((month) => (
                          <option key={month} value={month}>
                            {month} month deposit
                          </option>
                        ))}
                      </select>
                      {fieldErrors.depositMonths && (
                        <p className="deposit-field-error">
                          {fieldErrors.depositMonths}
                        </p>
                      )}
                    </div>

                    <div className="deposit-field deposit-field-full">
                      <div className="deposit-label-row">
                        <label htmlFor="deposit-note">Note</label>
                        <span>{note.length}/{NOTE_LIMIT}</span>
                      </div>
                      <textarea
                        id="deposit-note"
                        className="deposit-textarea"
                        value={note}
                        maxLength={NOTE_LIMIT}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Example: I would like to move in on the selected date."
                      />
                    </div>
                  </div>
                </section>

                <section className="deposit-summary" aria-labelledby="deposit-summary-title">
                  <div className="deposit-section-heading deposit-section-heading--summary">
                    <ReceiptText size={21} aria-hidden="true" />
                    <div>
                      <h2 id="deposit-summary-title">Request summary</h2>
                      <p>Review the amount before submitting.</p>
                    </div>
                  </div>

                  <dl className="deposit-summary-list">
                    <div>
                      <dt>Room type</dt>
                      <dd>{roomType?.typeName || "N/A"}</dd>
                    </div>
                    <div>
                      <dt>Monthly price</dt>
                      <dd>{formatCurrency(roomPrice)}</dd>
                    </div>
                    <div>
                      <dt>Deposit rule</dt>
                      <dd>
                        {depositMonths} month{Number(depositMonths) === 1 ? "" : "s"}
                      </dd>
                    </div>
                    <div className="deposit-summary-total">
                      <dt>Required deposit</dt>
                      <dd>{formatCurrency(requiredDeposit)}</dd>
                    </div>
                  </dl>

                  {fieldErrors.roomPrice && (
                    <p className="deposit-field-error deposit-summary-error">
                      {fieldErrors.roomPrice}
                    </p>
                  )}
                </section>

                <div className="deposit-request-notice">
                  <Info size={20} aria-hidden="true" />
                  <p>
                    This step only sends a request. Payment becomes available
                    after the owner accepts it.
                  </p>
                </div>

                {submitError && (
                  <div className="deposit-submit-error" role="alert">
                    <AlertCircle size={20} aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="deposit-form-actions">
                  <button
                    type="button"
                    className="deposit-button deposit-button--secondary"
                    onClick={handleBack}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="deposit-button deposit-button--primary"
                    disabled={submitting || roomUnavailable || roomPrice <= 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="deposit-spin" size={18} aria-hidden="true" />
                        Submitting...
                      </>
                    ) : authSession.isAuthenticated ? (
                      <>
                        <ShieldCheck size={18} aria-hidden="true" />
                        Submit deposit request
                      </>
                    ) : (
                      <>
                        <LogIn size={18} aria-hidden="true" />
                        Log in and submit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CreateDepositPage;
