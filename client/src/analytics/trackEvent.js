import axios from "../utils/axios";

// export const trackEvent = async (eventName, params = {}) => {
//   const client_id =
//     localStorage.getItem("ga_client_id") ||
//     `${Date.now()}.${Math.floor(Math.random() * 100000)}`;
//   localStorage.setItem("ga_client_id", client_id);

//   const payload = {
//     client_id,
//     events: [
//       {
//         name: eventName,
//         params: {
//           page_location: window.location.href,
//           ...params,
//         },
//       },
//     ],
//   };

//   await fetch("/api/analytics/ga-event", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ payload }),
//   });
// };

export const trackEvent = async (eventName, params = {}) => {
  const client_id =
    localStorage.getItem("ga_client_id") ||
    `${Date.now()}.${Math.floor(Math.random() * 100000)}`;
  localStorage.setItem("ga_client_id", client_id);

  const payload = {
    client_id,
    events: [
      {
        name: eventName,
        params: {
          page_location: window.location.href,
          ...params,
        },
      },
    ],
  };
  // console.log("Payload of trake event:",payload)
  try {
    await axios.post("/api/ga-proxy/ga-event", { payload });
    // Optionally: console.log("Event tracked");
  } catch (error) {
    console.error("Error tracking event:", error.message);
  }
};
