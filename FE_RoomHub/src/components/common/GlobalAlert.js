import React, { useEffect, useState } from "react";
import "./GlobalAlert.css";

const listeners = new Set();
const queue = [];
let currentAlert = null;
let installed = false;

const normalizeMessage = (value) => {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const detectType = (message) => {
  const text = String(message || "").toLowerCase();

  if (
    /success|successfully|created|added|updated|deleted|accepted|rejected|submitted|sent|completed|saved|cancelled successfully/.test(
      text,
    )
  ) {
    return "success";
  }

  if (
    /failed|error|unable|not found|unavailable|invalid|cannot|can't|server error|denied/.test(
      text,
    )
  ) {
    return "error";
  }

  if (
    /please|required|must|select|enter|fill|greater|less|before|after|future|past|warning/.test(
      text,
    )
  ) {
    return "warning";
  }

  return "info";
};

const getTitle = (type) => {
  switch (type) {
    case "success":
      return "Success";
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    default:
      return "Information";
  }
};

const notify = () => {
  listeners.forEach((listener) => listener(currentAlert));
};

const showNext = () => {
  if (currentAlert || queue.length === 0) return;
  currentAlert = queue.shift();
  notify();
};

export const closeGlobalAlert = () => {
  currentAlert = null;
  notify();
  window.setTimeout(showNext, 100);
};

export const showGlobalAlert = (message, options = {}) => {
  const normalizedMessage = normalizeMessage(message);
  const type = options.type || detectType(normalizedMessage);

  queue.push({
    id: `${Date.now()}-${Math.random()}`,
    message: normalizedMessage,
    type,
    title: options.title || getTitle(type),
    autoClose:
      typeof options.autoClose === "number"
        ? options.autoClose
        : type === "success"
          ? 2200
          : 3200,
  });

  showNext();
};

export const installGlobalAlert = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Keep a reference for debugging only; the application no longer calls it.
  window.__nativeAlert = window.alert.bind(window);

  // All existing alert(...) and window.alert(...) calls are redirected here.
  window.alert = (message) => {
    showGlobalAlert(message);
  };
};

const AlertIcon = ({ type }) => {
  if (type === "success") {
    return (
      <div className="global-alert__icon global-alert__icon--success">
        <span className="global-alert__check" />
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="global-alert__icon global-alert__icon--error">
        <span className="global-alert__cross global-alert__cross--one" />
        <span className="global-alert__cross global-alert__cross--two" />
      </div>
    );
  }

  if (type === "warning") {
    return (
      <div className="global-alert__icon global-alert__icon--warning">
        <span className="global-alert__symbol">!</span>
      </div>
    );
  }

  return (
    <div className="global-alert__icon global-alert__icon--info">
      <span className="global-alert__symbol">i</span>
    </div>
  );
};

export default function GlobalAlert() {
  const [alertData, setAlertData] = useState(currentAlert);

  useEffect(() => {
    const listener = (nextAlert) => setAlertData(nextAlert);
    listeners.add(listener);
    listener(currentAlert);

    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    if (!alertData || !alertData.autoClose) return undefined;

    const timer = window.setTimeout(() => {
      closeGlobalAlert();
    }, alertData.autoClose);

    return () => window.clearTimeout(timer);
  }, [alertData]);

  if (!alertData) return null;

  return (
    <div
      className="global-alert__overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeGlobalAlert();
      }}
    >
      <section
        className={`global-alert__modal global-alert__modal--${alertData.type}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="global-alert-title"
        aria-describedby="global-alert-message"
      >
        <button
          type="button"
          className="global-alert__close"
          aria-label="Close notification"
          onClick={closeGlobalAlert}
        >
          ×
        </button>

        <AlertIcon type={alertData.type} />

        <h2 id="global-alert-title" className="global-alert__title">
          {alertData.title}
        </h2>

        <p id="global-alert-message" className="global-alert__message">
          {alertData.message}
        </p>
      </section>
    </div>
  );
}
