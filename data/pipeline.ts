export const ARCHITECTURE_COLUMNS = [
  {
    title: "1. Data input",
    steps: [
      "Satellite image source",
      "Image collector",
      "Image storage",
    ],
    note: "This MVP can address a NASA GIBS browse tile. It does not archive Sentinel scenes.",
  },
  {
    title: "2. AI processing",
    steps: [
      "Preprocessing — crop, resize, normalize",
      "Feature extraction — CNN, ResNet, or DenseNet",
      "Landslide detection — area and probability",
      "Post-processing — drop false positives",
    ],
    note: "No weights are loaded. These stages stay marked not run unless TARRA_MODEL_URL returns a real probability.",
  },
  {
    title: "3. Output",
    steps: [
      "Threshold comparison",
      "Alert generation",
      "Local alert",
      "Regional alert",
    ],
    note: "The threshold applies to the heuristic score, not to a model probability. Alerts stay inside this browser.",
  },
] as const;

export const BRIEF_NOTES = [
  {
    title: "Feasibility",
    tone: "ok" as const,
    points: [
      "Satellite archives and open tools already exist.",
      "Published CNN, ResNet, and DenseNet studies show the detection approach the brief describes.",
      "A small service can be hosted cheaply. This prototype runs as one Next.js app.",
    ],
  },
  {
    title: "Challenges",
    tone: "risk" as const,
    points: [
      "Cloud and haze hide optical change. Radar would help, and it is not connected yet.",
      "Labelled landslide scenes are scarce and uneven.",
      "False alarms and missed failures both cause harm.",
      "Remote valleys may have no reliable way to receive an alert.",
    ],
  },
  {
    title: "Strategies in the brief",
    tone: "plan" as const,
    points: [
      "Use more than one sensor, and say which one actually answered.",
      "Augmentation and transfer learning, once a real training set exists.",
      "Tune the threshold instead of hiding uncertain scores.",
      "Keep a path that works when the network does not. That is Demo Data.",
    ],
  },
];
