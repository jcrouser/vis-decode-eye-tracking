# Visual decoding eye-tracking pilot

Open `/vis-decode-eye-tracking` after starting the existing app with `yarn serve`. The new study is registered in `public/global.json`. Existing studies retain their configurations. It reuses the original Plot, DistributionSlider, ScalesProvider and generalized-t distribution calculations.

## Pilot defaults

Five blocks contain CDF curve crossing, CDF crossing projected to the x-axis, PDF peak, PDF equal area, and dot-to-x-axis projection. Block order is randomized by reVISit. Each has two practice trials followed by six randomly ordered test trials (40 trials total). This is random ordering rather than a balanced Latin square. The six test stimuli cross three skew values with two location values. Matched distribution parameters recur across task blocks. Practice feedback is available only on request and is logged.

Stimuli are deterministic. The pilot calls generateDistributionData directly, avoiding the original generator's random replacement of unsuitable parameters. The sampled PDF mode and interpolated CDF median are stored. The full x/PDF/CDF arrays are included for reproducibility. Distribution tails extend outside the displayed range; evaluate visible-area versus full-distribution median differences before finalizing the protocol. The CDF-axis condition changes the response marker's location as well as its instruction; account for that elicitation difference in the analysis.

## Recording and export

Each component saves `pilot-record`, a JSON string in the ordinary reVISit answer record. It contains task, practice status, trial ID, mount/attempt UUID, stimulus parameters and arrays, target/landmarks, selection and an event array. Events include chart animation-frame callback, geometry, first selection, slider changes/commits, practice feedback, page visibility and optional tracker sync. Each event has performance.now() and performance.timeOrigin + performance.now(). The frame callback estimates browser onset; it is not measured photon onset. The ordinary reVISit component start/end timestamps supply trial navigation timing. Next is enabled after a committed selection and disabled during subsequent edits.

Automatic study download is enabled. Use the existing reVISit export/storage workflow. Pair the participant session and trial IDs from that export with the tracker recording. Local/browser persistence and any server storage follow the repository's existing backend configuration. Verify the configured backend before using actual participant data.

## Hardware bridge contract

No tracker SDK is assumed or installed. The pilot emits `window` CustomEvents named `vis-decode-marker`. Their detail contains trialId, attemptId, type, browser monotonic time, epoch estimate and event detail. An in-page bridge can subscribe and forward markers to the tracker SDK or acquisition process. The bridge should record receive time in device units and estimate clock offset/drift using repeated synchronization measurements.

The bridge may dispatch `vis-decode-tracker-sync` with detail `{device: 'tracker-name', deviceTime: 12345, unit: 'microseconds'}`. These become timestamped sync records. This is a marker interface, not a gaze acquisition implementation. Save high-rate gaze in the tracker recorder. Validate the bridge's latency, calibration, drift, invalid samples and clock mapping on the chosen hardware.

Geometry events include the chart's viewport CSS-pixel rectangle, viewport size, scroll offset, device pixel ratio and SVG landmark positions. SVG coordinates use a 600 by 450 chart. Convert tracker screen coordinates to browser viewport coordinates using independently measured browser/screen offsets; the recorded rectangle alone does not establish that mapping. Reconstruct areas of interest from stored geometry with a tolerance based on measured tracker accuracy. Geometry is recorded at onset, resize and scroll. The response slider lies above the chart and should have its own control AOI when analyzing attention.

## Validation

Run `yarn typecheck`, `yarn unittest run src/utils/eyeTrackingPilot.spec.ts`, and `yarn build`. The repository asks the owner to run Playwright rather than invoking `yarn test` here. Manual checks should cover all five task blocks, initially hidden marker/disabled Next, pointer and keyboard adjustment, practice feedback, no feedback in test trials, randomized order, download parsing, and tracker marker timestamps. Hardware validation remains necessary before data collection.

## Tobii Pro T60XL target

Tobii's compatibility page lists the T60XL with firmware 2.0.0 or newer and a Pro SDK older than 2.0. SDK 2.x dropped this tracker. Choose an available SDK 1.x distribution compatible with the acquisition computer's OS and Python version, and test device discovery before implementing the recorder. No additional SDK package is installed by this change. Pro Lab 24.21 is the last version Tobii explicitly lists as officially supporting this model. An already functioning acquisition workstation is a useful starting point.

- https://developer.tobiipro.com/tobiiprosdk/eyetrackercompatibility.html
- https://www.tobii.com/products/software/behavior-research-software/tobii-pro-lab/features

Set uiConfig.contactEmail to the study team's confirmed contact address before deployment. It is intentionally empty in this development configuration.
