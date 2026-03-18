# @morphixai/core

## 0.8.2

### Patch Changes

- Mark mx_flights and mx_figma as unavailable

  - mx_flights: tool under development, all calls rejected with unavailable status
  - mx_figma: Pipedream OAuth scope insufficient (missing file_content:read), marked unavailable until resolved
  - Both tools retain full implementation code for future re-enablement
