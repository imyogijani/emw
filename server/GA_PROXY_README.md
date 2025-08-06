# Google Analytics Proxy Setup

This backend exposes a proxy endpoint for Google Analytics 4 Measurement Protocol events.

## Endpoint

POST `/api/analytics/ga-event`

- Accepts: `{ payload: <GA4 event payload> }`
- Proxies the event to Google Analytics using your Measurement ID and API Secret.

## Environment Variables

Add these to your `.env` file:

<!-- ```
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=YOUR_GA4_API_SECRET
``` -->

## Example Frontend Usage

```js
await fetch('/api/analytics/ga-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payload: {
      client_id: '123.456', // required
      events: [
        { name: 'page_view', params: { page_location: window.location.href } }
      ]
    }
  })
});
```

- See [GA4 Measurement Protocol docs](https://developers.google.com/analytics/devguides/collection/protocol/ga4) for payload details.
