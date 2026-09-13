// ============================================================
// START: IMPORTS
// ============================================================

// Import our application's CSS file.
import "./style.css";

// Three.js is the underlying 3D graphics library.
//
// We use Three.js directly for things such as:
// - THREE.Color
// - THREE.Box3
// - THREE.Camera
import * as THREE from "three";

// OBC = ThatOpen Components.
//
// This is the main ThatOpen library.
// It provides the core BIM viewer systems such as:
// - Components
// - Worlds
// - Scene
// - Camera
// - Renderer
// - Fragments Manager
// - Clipper
// - Hider
// - Classifier
// - Raycasters
import * as OBC from "@thatopen/components";

// OBCF = ThatOpen Components Front.
//
// These are viewer/frontend tools built on top of the
// ThatOpen core components.
//
// We use this for:
// - Highlighter
// - Hoverer
// - Renderer helpers
import * as OBCF from "@thatopen/components-front";

// BUI = ThatOpen UI.
//
// Provides UI components such as:
// - Panels
// - Buttons
// - Checkboxes
// - Text inputs
import * as BUI from "@thatopen/ui";

// BUIC = ThatOpen UI components connected to BIM functionality.
//
// We use this for things such as:
// - Spatial Tree
// - FRAG loading controls
import * as BUIC from "@thatopen/ui-obc";

// Import our own BIM query function.
//
// The actual BIM data querying logic lives in bimQuery.ts.
// Keeping it there prevents main.ts from becoming responsible
// for all BIM data access.
import { queryBIMElement } from "./bimQuery";

// ============================================================
// END: IMPORTS
// ============================================================


// ============================================================
// START: INITIALIZE THATOPEN UI
// ============================================================

// Initialize the main ThatOpen UI system.
BUI.Manager.init();

// Initialize the ThatOpen UI components that are specifically
// connected to BIM functionality.
BUIC.Manager.init();

// ============================================================
// END: INITIALIZE THATOPEN UI
// ============================================================


// ============================================================
// START: CREATE THATOPEN COMPONENT SYSTEM
// ============================================================

// Create the main ThatOpen Components container.
//
// This acts as the central manager for the different
// ThatOpen systems used by our BIM viewer.
const components = new OBC.Components();

// Get the Worlds manager from the Components container.
//
// The Worlds manager creates and manages our 3D worlds.
const worlds = components.get(OBC.Worlds);

// ============================================================
// END: CREATE THATOPEN COMPONENT SYSTEM
// ============================================================


// ============================================================
// START: CREATE 3D WORLD
// ============================================================

// Create the main 3D world.
//
// A world connects three major parts:
//
// Scene
//   → The objects that exist in the 3D environment.
//
// Camera
//   → What the user sees.
//
// Renderer
//   → Draws the 3D world onto the screen.
const world = worlds.create<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>();

// Give the world a name.
world.name = "main";

// ============================================================
// END: CREATE 3D WORLD
// ============================================================


// ============================================================
// START: CREATE SCENE
// ============================================================

// Create the scene that will contain our 3D objects.
const sceneComponent = new OBC.SimpleScene(components);

// Configure the scene with ThatOpen's default setup.
sceneComponent.setup();

// Attach the scene to our world.
world.scene = sceneComponent;

// ============================================================
// END: CREATE SCENE
// ============================================================


// ============================================================
// START: CREATE VIEWPORT AND RENDERER
// ============================================================

// Create the HTML element that will contain our 3D viewer.
const viewport = document.createElement("bim-viewport");

// Create the renderer.
const rendererComponent = new OBCF.RendererWith2D(
  components,
  viewport,
);

// Attach the renderer to our world.
world.renderer = rendererComponent;

// ============================================================
// END: CREATE VIEWPORT AND RENDERER
// ============================================================


// ============================================================
// START: CREATE CAMERA
// ============================================================

// Create the camera used by the BIM viewer.
const cameraComponent = new OBC.SimpleCamera(components);

// Attach the camera to our world.
world.camera = cameraComponent;

// ============================================================
// END: CREATE CAMERA
// ============================================================


// ============================================================
// START: VIEWPORT RESIZE HANDLER
// ============================================================

// Listen for viewport resize events.
viewport.addEventListener("resize", () => {

  // Tell the renderer that the drawing area changed.
  rendererComponent.resize();

  // Update the camera aspect ratio.
  cameraComponent.updateAspect();

}); // END: resize event callback

// ============================================================
// END: VIEWPORT RESIZE HANDLER
// ============================================================


// ============================================================
// START: CREATE GRID
// ============================================================

// Get the Grid manager from ThatOpen.
const viewerGrids = components.get(OBC.Grids);

// Create a grid inside our world.
const grid = viewerGrids.create(world);

// ============================================================
// END: CREATE GRID
// ============================================================


// ============================================================
// START: INITIALIZE COMPONENT SYSTEM
// ============================================================

// Initialize the ThatOpen component system.
//
// At this point we have:
//
// Components
//    ↓
// World
//    ├── Scene
//    ├── Camera
//    └── Renderer
components.init();

// ============================================================
// END: INITIALIZE COMPONENT SYSTEM
// ============================================================


// ============================================================
// START: INITIALIZE IFC LOADER
// ============================================================

// Get the IFC Loader.
const ifcLoader = components.get(OBC.IfcLoader);

// Prepare the IFC Loader.
await ifcLoader.setup();

// ============================================================
// END: INITIALIZE IFC LOADER
// ============================================================


// ============================================================
// START: INITIALIZE FRAGMENTS MANAGER
// ============================================================

// Get the worker used by the Fragments system.
const workerUrl = await OBC.FragmentsManager.getWorker();

// Get the Fragments Manager.
const fragments = components.get(OBC.FragmentsManager);

// Initialize the Fragments Manager using the worker.
fragments.init(workerUrl);

// ============================================================
// END: INITIALIZE FRAGMENTS MANAGER
// ============================================================


// ============================================================
// START: LOAD SAMPLE FRAG MODEL
// ============================================================

// Prevent the same FRAG model from being loaded more than once.
let sampleModelLoaded = false;

// ------------------------------------------------------------
// START: FUNCTION - loadSampleFragment()
// ------------------------------------------------------------

// Download the FRAG file, convert it to binary data,
// and load it into the Fragments Manager.
const loadSampleFragment = async () => {

  // Stop if this model has already been loaded.
  if (sampleModelLoaded) {
    return;
  }

  try {

    // Download the FRAG file.
    const response = await fetch("/sample.frag");

    // Explicitly check HTTP errors.
    if (!response.ok) {
      throw new Error(
        `Failed to load sample fragment: ${response.status} ${response.statusText}`,
      );
    }

    // Convert the response into raw binary data.
    const arrayBuffer = await response.arrayBuffer();

    // Convert the binary buffer into bytes.
    const fragmentData = new Uint8Array(arrayBuffer);

    // Load the FRAG data.
    await fragments.core.load(
      fragmentData,
      {
        modelId: "sample-model",
      },
    );

    // Mark the model as loaded.
    sampleModelLoaded = true;

  } catch (error) {

    // Report loading failure.
    console.error(
      "Could not load the sample fragment automatically.",
      error,
    );

  }

}; // END: loadSampleFragment()

// ------------------------------------------------------------
// END: FUNCTION - loadSampleFragment()
// ------------------------------------------------------------

// ============================================================
// END: LOAD SAMPLE FRAG MODEL
// ============================================================



// ============================================================
// START: HIGHLIGHTER
// ============================================================

const highlighter = components.get(OBCF.Highlighter);

highlighter.setup({
  world,
});

highlighter.zoomToSelection = false;

// Store the currently selected BIM element.
let selectedBIMData:
  | {
      modelId: string;
      localId: number;
    }
  | null = null;

// ------------------------------------------------------------
// START: HIGHIGHTER SELECTION EVENT
// ------------------------------------------------------------

highlighter.events.select.onHighlight.add(
  (modelIdMap) => {

    const firstSelection =
      Object.entries(modelIdMap)[0];

    if (!firstSelection) {
      return;
    }

    const [
      modelId,
      localIds,
    ] = firstSelection;

    const localId =
      [...localIds][0];

    if (
      localId === undefined
    ) {
      return;
    }

    selectedBIMData = {
      modelId,
      localId: Number(localId),
    };

  },
);

// ------------------------------------------------------------
// END: HIGHIGHTER SELECTION EVENT
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: CLEAR SELECTION DATA
// ------------------------------------------------------------

highlighter.events.select.onClear.add(
  () => {

    selectedBIMData = null;

  },
);

// ------------------------------------------------------------
// END: CLEAR SELECTION DATA
// ------------------------------------------------------------


// ============================================================
// END: BIM SELECTION
// ============================================================

// ============================================================
// END: HIGHLIGHTER
// ============================================================

highlighter.zoomToSelection = false;



// ============================================================
// START: DOUBLE-CLICK PROPERTY PANEL
// ============================================================

// Listen for a double-click anywhere inside the BIM viewport.
viewport.addEventListener("dblclick", async () => {

  if (clipper.enabled) return;

  // Get the element currently under the mouse.
  const result = highlighter.highlight("select");

  // If nothing was selected, stop here.
  if (!result) return;

  if (!selectedBIMData) return;

  void runRawBIMQuery({
    modelId:
      selectedBIMData.modelId,

    localId:
      selectedBIMData.localId,
  });

});

// ============================================================
// END: DOUBLE-CLICK PROPERTY PANEL
// ============================================================


// ============================================================
// START: HOVERER
// ============================================================

const hoverer = components.get(OBCF.Hoverer);

hoverer.world = world;
hoverer.enabled = true;

// ============================================================
// END: HOVERER
// ============================================================


// ============================================================
// START: VIEWER INTERACTION COMPONENTS
// ============================================================

const casters = components.get(OBC.Raycasters);

// Tell the engine to map cursor coordinates inside our world.
casters.get(world);

const clipper = components.get(OBC.Clipper);
clipper.enabled = false;

const classifier = components.get(OBC.Classifier);
classifier.enabled = true;

const hider = components.get(OBC.Hider);
hider.enabled = true;

// ============================================================
// END: VIEWER INTERACTION COMPONENTS
// ============================================================


// ============================================================
// START: MODEL VISIBILITY
// ============================================================

const floorControlList =
  document.createElement("div");

const storeyClassificationName =
  "Storeys";

const floorGroups =
  new Map<string, boolean>();

let ifcSpacesVisible = true;
let clipperEnabled = false;

const clipperStatusLabel =
  document.createElement("div");

clipperStatusLabel.textContent =
  "Clipper: Disabled";

clipperStatusLabel.style.position =
  "absolute";

clipperStatusLabel.style.top =
  "0.75rem";

clipperStatusLabel.style.left =
  "0.75rem";

clipperStatusLabel.style.zIndex =
  "10";

clipperStatusLabel.style.padding =
  "0.35rem 0.6rem";

clipperStatusLabel.style.borderRadius =
  "0.35rem";

clipperStatusLabel.style.background =
  "rgba(32, 41, 50, 0.85)";

clipperStatusLabel.style.color =
  "white";

clipperStatusLabel.style.fontSize =
  "0.85rem";

clipperStatusLabel.style.pointerEvents =
  "none";

viewport.style.position =
  "relative";

viewport.appendChild(
  clipperStatusLabel,
);

// ------------------------------------------------------------
// START: FUNCTION - updateClipperStatusLabel()
// ------------------------------------------------------------

const updateClipperStatusLabel = () => {

  clipperStatusLabel.textContent =
    clipperEnabled
      ? "Clipper: Enabled"
      : "Clipper: Disabled";

};

// ------------------------------------------------------------
// END: FUNCTION - updateClipperStatusLabel()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: ELEMENT TYPE DEFINITIONS
// ------------------------------------------------------------

const elementTypeDefinitions = [

  {
    name: "Walls",
    regexes: [
      new RegExp(
        "^IFCWALL(?:STANDARDCASE)?$",
        "i",
      ),
    ],
  },

  {
    name: "Stairs",
    regexes: [
      new RegExp(
        "^IFCSTAIR(?:S)?$",
        "i",
      ),

      new RegExp(
        "^STAIR(?:S)?$",
        "i",
      ),

      new RegExp(
        "^IFCSTAIRFLIGHT$",
        "i",
      ),
    ],
  },

  {
    name: "Slabs",
    regexes: [
      new RegExp(
        "^IFCSLAB$",
        "i",
      ),
    ],
  },

  {
    name: "Beams",
    regexes: [
      new RegExp(
        "^IFCBEAM$",
        "i",
      ),
    ],
  },

  {
    name: "Columns",
    regexes: [
      new RegExp(
        "^IFCCOLUMN$",
        "i",
      ),
    ],
  },

  {
    name: "Doors",
    regexes: [
      new RegExp(
        "^IFCDOOR$",
        "i",
      ),
    ],
  },

  {
    name: "Windows",
    regexes: [
      new RegExp(
        "^IFCWINDOW$",
        "i",
      ),
    ],
  },

  {
    name: "Roofs",
    regexes: [
      new RegExp(
        "^IFCROOF$",
        "i",
      ),
    ],
  },

  {
    name: "Railings",
    regexes: [
      new RegExp(
        "^IFCRAILING$",
        "i",
      ),
    ],
  },

  {
    name: "Furniture",
    regexes: [
      new RegExp(
        "^IFCFURNITURE$",
        "i",
      ),
    ],
  },

];

// ------------------------------------------------------------
// END: ELEMENT TYPE DEFINITIONS
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: ELEMENT TYPE VISIBILITY
// ------------------------------------------------------------

const elementTypeVisibility =
  new Map<string, boolean>();

const elementTypeListContainer =
  document.createElement("div");

elementTypeListContainer.style.display =
  "flex";

elementTypeListContainer.style.flexDirection =
  "column";

elementTypeListContainer.style.gap =
  "0.25rem";

elementTypeListContainer.style.marginTop =
  "0.5rem";

// ------------------------------------------------------------
// START: FUNCTION - setElementTypeVisibility()
// ------------------------------------------------------------

const setElementTypeVisibility = async (
  elementTypeName: string,
  visible: boolean,
) => {

  const definition =
    elementTypeDefinitions.find(
      (item) =>
        item.name === elementTypeName,
    );

  if (!definition) {
    return;
  }

  const modelIdMap:
    OBC.ModelIdMap = {};

  for (
    const [, model]
    of fragments.list
  ) {

    const items =
      await model.getItemsOfCategories(
        definition.regexes,
      );

    const localIds =
      Object.values(items)
        .flat()
        .filter(
          (id): id is number =>
            typeof id === "number",
        );

    if (localIds.length > 0) {

      modelIdMap[model.modelId] =
        new Set(localIds);

    }

  }

  if (
    Object.keys(modelIdMap).length > 0
  ) {

    await hider.set(
      visible,
      modelIdMap,
    );

  }

  elementTypeVisibility.set(
    elementTypeName,
    visible,
  );

};

// ------------------------------------------------------------
// END: FUNCTION - setElementTypeVisibility()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - renderElementTypeVisibilityControls()
// ------------------------------------------------------------

const renderElementTypeVisibilityControls = () => {

  elementTypeListContainer.innerHTML =
    "";

  const title =
    document.createElement(
      "bim-label",
    );

  title.textContent =
    "Element Type Visibility";

  title.style.fontWeight =
    "600";

  title.style.marginTop =
    "0.5rem";

  elementTypeListContainer.appendChild(
    title,
  );

  for (
    const definition
    of elementTypeDefinitions
  ) {

    const row =
      document.createElement("div");

    row.style.display =
      "flex";

    row.style.alignItems =
      "center";

    row.style.gap =
      "0.35rem";

    const checkbox =
      document.createElement(
        "bim-checkbox",
      ) as any;

    checkbox.setAttribute(
      "label",
      definition.name,
    );

    const currentValue =
      elementTypeVisibility.get(
        definition.name,
      ) ?? true;

    if (currentValue) {

      checkbox.setAttribute(
        "checked",
        "true",
      );

    }

    checkbox.addEventListener(
      "change",
      async () => {

        const checked =
          checkbox.checked ??
          checkbox.value ??
          false;

        await setElementTypeVisibility(
          definition.name,
          !!checked,
        );

      },
    );

    row.appendChild(
      checkbox,
    );

    elementTypeListContainer.appendChild(
      row,
    );

  }

};

// ------------------------------------------------------------
// END: FUNCTION - renderElementTypeVisibilityControls()
// ------------------------------------------------------------

renderElementTypeVisibilityControls();

// ------------------------------------------------------------
// START: FUNCTION - renderFloorControls()
// ------------------------------------------------------------

const renderFloorControls = () => {

  floorControlList.innerHTML =
    "";

  const storeys =
    classifier.list.get(
      storeyClassificationName,
    );

  if (
    !storeys ||
    storeys.size === 0
  ) {

    const empty =
      document.createElement("div");

    empty.textContent =
      "No floor/storey groups found yet.";

    floorControlList.appendChild(
      empty,
    );

    return;
  }

  const actions =
    document.createElement("div");

  actions.style.display =
    "flex";

  actions.style.gap =
    "0.5rem";

  const showAll =
    BUI.Component.create(
      () => BUI.html`
        <bim-button label="Show all floors"></bim-button>
      `,
    );

  showAll.addEventListener(
    "click",
    async () => {

      await hider.set(true);

      for (
        const key
        of floorGroups.keys()
      ) {

        floorGroups.set(
          key,
          true,
        );

      }

      renderFloorControls();

    },
  );

  actions.appendChild(
    showAll,
  );

  const hideAll =
    BUI.Component.create(
      () => BUI.html`
        <bim-button label="Hide all floors"></bim-button>
      `,
    );

  hideAll.addEventListener(
    "click",
    async () => {

      await hider.set(false);

      for (
        const key
        of floorGroups.keys()
      ) {

        floorGroups.set(
          key,
          false,
        );

      }

      renderFloorControls();

    },
  );

  actions.appendChild(
    hideAll,
  );

  floorControlList.appendChild(
    actions,
  );

  for (
    const [storeyName, groupData]
    of storeys
  ) {

    const labelContainer =
      document.createElement("div");

    labelContainer.style.marginTop =
      "0.5rem";

    labelContainer.style.display =
      "flex";

    labelContainer.style.alignItems =
      "center";

    labelContainer.style.gap =
      "0.5rem";

    const checkbox =
      document.createElement(
        "bim-checkbox",
      ) as any;

    const labelText =
      storeyName ||
      "Unnamed floor";

    checkbox.setAttribute(
      "label",
      labelText,
    );

    const currentValue =
      floorGroups.has(storeyName)
        ? floorGroups.get(storeyName)
        : true;

    if (currentValue) {

      checkbox.setAttribute(
        "checked",
        "true",
      );

    }

    checkbox.addEventListener(
      "change",
      async () => {

        const checked =
          checkbox.checked ??
          checkbox.value ??
          false;

        const show =
          !!checked;

        floorGroups.set(
          storeyName,
          show,
        );

        await hider.set(
          show,
          groupData.map,
        );

      },
    );

    labelContainer.appendChild(
      checkbox,
    );

    floorControlList.appendChild(
      labelContainer,
    );

    if (
      !floorGroups.has(storeyName)
    ) {

      floorGroups.set(
        storeyName,
        true,
      );

    }

  }

};

// ------------------------------------------------------------
// END: FUNCTION - renderFloorControls()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - debugIfcSpaces()
// ------------------------------------------------------------

const debugIfcSpaces = async () => {

  const modelIdMap:
    OBC.ModelIdMap = {};

  const categoriesRegex = [
    new RegExp(
      "^IFCSPACE$",
      "i",
    ),
  ];

  const perModelResults:
    Array<{
      modelId: string;
      count: number;
      localIds: number[];
    }> = [];

  for (
    const [, model]
    of fragments.list
  ) {

    const items =
      await model.getItemsOfCategories(
        categoriesRegex,
      );

    const localIds =
      Object.values(items)
        .flat()
        .filter(
          (id): id is number =>
            typeof id === "number",
        );

    if (
      localIds.length > 0
    ) {

      modelIdMap[model.modelId] =
        new Set(localIds);

    }

    perModelResults.push({
      modelId:
        model.modelId,

      count:
        localIds.length,

      localIds,
    });

  }

  console.groupCollapsed(
    "[IFCSPACE debug]",
  );

  console.log(
    "Models checked:",
    perModelResults.length,
  );

  console.table(
    perModelResults.map(
      ({ modelId, count }) => ({
        modelId,
        count,
      }),
    ),
  );

  console.log(
    "Detailed matches:",
    perModelResults,
  );

  console.groupEnd();

  return {
    modelIdMap,
    perModelResults,
  };

};

// ------------------------------------------------------------
// END: FUNCTION - debugIfcSpaces()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - setIfcSpacesVisibility()
// ------------------------------------------------------------

const setIfcSpacesVisibility =
  async (
    visible: boolean,
  ) => {

    const {
      modelIdMap,
    } = await debugIfcSpaces();

    if (
      Object.keys(modelIdMap).length > 0
    ) {

      await hider.set(
        visible,
        modelIdMap,
      );

      console.log(
        `${visible ? "Showing" : "Hiding"} IFC spaces in ${Object.keys(modelIdMap).length} model(s).`,
      );

    } else {

      console.log(
        `No IFCSPACE items were found to ${visible ? "show" : "hide"}.`,
      );

    }

    ifcSpacesVisible =
      visible;

  };

// ------------------------------------------------------------
// END: FUNCTION - setIfcSpacesVisibility()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - toggleIfcSpacesVisibility()
// ------------------------------------------------------------

const toggleIfcSpacesVisibility =
  async () => {

    await setIfcSpacesVisibility(
      !ifcSpacesVisible,
    );

  };

// ------------------------------------------------------------
// END: FUNCTION - toggleIfcSpacesVisibility()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - classifyFloors()
// ------------------------------------------------------------

const classifyFloors = async () => {

  try {

    await classifier.byIfcBuildingStorey({
      classificationName:
        storeyClassificationName,

      modelIds: [
        /sample-model/,
      ],
    });

    renderFloorControls();

  } catch (error) {

    console.warn(
      "Floor classification failed:",
      error,
    );

  }

};

// ------------------------------------------------------------
// END: FUNCTION - classifyFloors()
// ------------------------------------------------------------

// ============================================================
// END: MODEL VISIBILITY
// ============================================================


// ============================================================
// START: CONTROL PANEL SECTION LIFECYCLE MANAGER
// ============================================================
//
// This manager controls temporary interaction states such as
// the active clipping tool. The BIM selection and property
// panel remain independent and stay active while a temporary
// tool is in use.

let activeControlPanelCleanup:
  (() => void) | null = null;

// ------------------------------------------------------------
// START: FUNCTION - switchControlPanelSection()
// ------------------------------------------------------------

const switchControlPanelSection = (
  activateSection: () => (() => void) | void,
) => {

  // Remove listeners belonging to the previous section.
  if (activeControlPanelCleanup) {
    activeControlPanelCleanup();
    activeControlPanelCleanup = null;
  }

  // Activate the new section.
  const cleanup = activateSection();

  // Remember how to clean up the new section later.
  if (cleanup) {
    activeControlPanelCleanup = cleanup;
  }

};

// ------------------------------------------------------------
// END: FUNCTION - switchControlPanelSection()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - cleanupActiveControlPanelSection()
// ------------------------------------------------------------

const cleanupActiveControlPanelSection = () => {

  if (activeControlPanelCleanup) {
    activeControlPanelCleanup();
    activeControlPanelCleanup = null;
  }

};

// ------------------------------------------------------------
// END: FUNCTION - cleanupActiveControlPanelSection()
// ------------------------------------------------------------

// ============================================================
// END: CONTROL PANEL SECTION LIFECYCLE MANAGER
// ============================================================


// ============================================================
// START: VIEWPORT AND KEYBOARD INTERACTION
// ============================================================
//
// Tool-specific viewport and keyboard listeners are created by
// the active control-panel section instead of living forever.

// ============================================================
// END: VIEWPORT AND KEYBOARD INTERACTION
// ============================================================


// ============================================================
// START: CLIPPER CONTROLS
// ============================================================

// Toggle existing cuts on/off.
const toggleClippings = () => {

  for (
    const [, clipping]
    of clipper.list
  ) {

    clipping.enabled =
      !clipping.enabled;

  }

};

// ============================================================
// END: CLIPPER CONTROLS
// ============================================================


// ============================================================
// START: VIEW CUBE
// ============================================================

const viewCubeSize = 80;

const viewCube =
  document.createElement(
    "bim-view-cube",
  ) as HTMLElement & {
    size: number;
    camera: THREE.Camera;
    updateOrientation: () => void;
  };

viewCube.size =
  viewCubeSize;

viewCube.camera =
  world.camera.three;

viewport.append(
  viewCube,
);

// ------------------------------------------------------------
// START: CAMERA UPDATE EVENT
// ------------------------------------------------------------

world.camera.controls.addEventListener(
  "update",
  () => {

    fragments.core.update();

    if (
      typeof viewCube.updateOrientation ===
      "function"
    ) {

      viewCube.updateOrientation();

    }

  },
);

// ------------------------------------------------------------
// END: CAMERA UPDATE EVENT
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: VIEW CUBE BUTTONS
// ------------------------------------------------------------

viewCube.addEventListener(
  "frontclick",
  () => {

    world.camera.controls.setLookAt(
      0,
      0,
      50,
      0,
      0,
      0,
      true,
    );

  },
);

viewCube.addEventListener(
  "backclick",
  () => {

    world.camera.controls.setLookAt(
      0,
      0,
      -50,
      0,
      0,
      0,
      true,
    );

  },
);

viewCube.addEventListener(
  "leftclick",
  () => {

    world.camera.controls.setLookAt(
      -50,
      0,
      0,
      0,
      0,
      0,
      true,
    );

  },
);

viewCube.addEventListener(
  "rightclick",
  () => {

    world.camera.controls.setLookAt(
      50,
      0,
      0,
      0,
      0,
      0,
      true,
    );

  },
);

viewCube.addEventListener(
  "topclick",
  () => {

    world.camera.controls.setLookAt(
      0,
      50,
      0,
      0,
      0,
      0,
      true,
    );

  },
);

viewCube.addEventListener(
  "bottomclick",
  () => {

    world.camera.controls.setLookAt(
      0,
      -100,
      0,
      0,
      0,
      0,
      true,
    );

  },
);

// ------------------------------------------------------------
// END: VIEW CUBE BUTTONS
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: RESET VIEWER
// ------------------------------------------------------------
async function resetViewer() {

  // Home View
  setHomeView();

  // Reset all floors
  await hider.set(true);

  for (
    const key
    of floorGroups.keys()
  ) {

    floorGroups.set(
      key,
      true,
    );

  }

  renderFloorControls();


  // Reset all element types
  for (
    const definition
    of elementTypeDefinitions
  ) {

    await setElementTypeVisibility(
      definition.name,
      true,
    );

  }

  renderElementTypeVisibilityControls();
  

  // Keep IFCSPACE hidden
  await setIfcSpacesVisibility(false);

}

// ------------------------------------------------------------
// END: RESET VIEWER
// ------------------------------------------------------------



// ------------------------------------------------------------
// START: HOME VIEW
// ------------------------------------------------------------

let currentModel: any = null;

function setHomeView() {

  if (!currentModel) {
    return;
  }

  try {

    const box =
      new THREE.Box3()
        .setFromObject(
          currentModel.object,
        );

    const center =
      box.getCenter(
        new THREE.Vector3(),
      );

    const size =
      box.getSize(
        new THREE.Vector3(),
      );

    const maxSize =
      Math.max(
        size.x,
        size.y,
        size.z,
      );

    const distance =
      maxSize * 1.2;

    world.camera.controls.setLookAt(
      center.x + distance * 0.7,
      center.y + distance * 0.45,
      center.z + distance * 0.7,
      center.x,
      center.y,
      center.z,
      true,
    );

  } catch (e) {

    // Ignore bounding-box failures.

  }
}

// ------------------------------------------------------------
// END: HOME VIEW
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: MODEL RENDERING ON LOAD
// ------------------------------------------------------------

fragments.list.onItemSet.add(
  async ({ value: model }) => {

    currentModel = model;

    model.useCamera(
      world.camera.three,
    );

    world.scene.three.add(
      model.object,
    );

    await fragments.core.update(
      true,
    );

    // Move grid to model's lowest point
    // and set the initial Home View.
    try {

      const box =
        new THREE.Box3()
          .setFromObject(
            model.object,
          );

      const minY =
        box.min.y;

      if (
        Number.isFinite(minY) &&
        grid &&
        grid.three
      ) {

        grid.three.position.y =
          minY;

        grid.three.updateMatrixWorld();

      }

      setHomeView();    
    
    } catch (e) {

      // Ignore bounding-box failures.

    }

    await classifyFloors();

    await setIfcSpacesVisibility(
      false,
    );

  },
);

// Start loading the model after the rendering listener is ready.
void loadSampleFragment();

// ------------------------------------------------------------
// END: MODEL RENDERING ON LOAD
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: REMOVE Z-FIGHTING
// ------------------------------------------------------------

fragments.core.models.materials.list.onItemSet.add(
  ({ value: material }) => {

    if (
      !(
        "isLodMaterial" in material &&
        material.isLodMaterial
      )
    ) {

      material.polygonOffset =
        true;

      material.polygonOffsetUnits =
        1;

      material.polygonOffsetFactor =
        Math.random();

    }

  },
);

// ------------------------------------------------------------
// END: REMOVE Z-FIGHTING
// ------------------------------------------------------------

// ============================================================
// END: VIEW CUBE
// ============================================================


// ============================================================
// START: MODEL LOAD EVENTS + SPATIAL TREE
// ============================================================

const spatialTree =
  BUIC.tables.spatialTree({
    components,
    models: [],
  })[0] as any;

spatialTree.preserveStructureOnFilter =
  true;

spatialTree.selectableRows =
  false;

// ============================================================
// END: MODEL LOAD EVENTS + SPATIAL TREE
// ============================================================


// ============================================================
// START: BIM PROPERTY PANEL
// ============================================================
//
// PURPOSE:
//
// This section is responsible for DISPLAYING BIM information.
//
// The BIM data itself comes from:
//
//     bimQuery.ts
//
// The flow is:
//
//     Spatial Tree
//          ↓
//     modelId + localId
//          ↓
//     queryBIMElement()
//          ↓
//     Raw BIM data
//          ↓
//     Organize information
//          ↓
//     Compact Property Panel
//
// IMPORTANT:
//
// This section does NOT query the IFC model directly.
//
// It receives the result from bimQuery.ts and decides
// how that information should be presented.
//
// ============================================================


// ============================================================
// START: CREATE PROPERTY PANEL
// ============================================================
//
// The property panel is intentionally compact.
//
// The goal is to resemble a professional BIM inspector:
//
// - Small font
// - Tight spacing
// - Two-column property rows
// - Clear grouping
// - Minimal empty space
//
// ============================================================

const propertyOverlay =
  document.createElement("div");

// Position the property panel on the right side.
propertyOverlay.style.position =
  "absolute";

propertyOverlay.style.top =
  "3.5rem";

propertyOverlay.style.right =
  "0.75rem";

propertyOverlay.style.display =
  "none";

// Compact panel width.
propertyOverlay.style.width =
  "26rem";

// Limit height.
propertyOverlay.style.maxHeight =
  "70vh";

// Allow scrolling for large BIM objects.
propertyOverlay.style.overflow =
  "auto";

// Dark background.
propertyOverlay.style.background =
  "rgba(12, 16, 22, 0.96)";

// Subtle border.
propertyOverlay.style.border =
  "1px solid rgba(255,255,255,0.12)";

// Compact rounded corners.
propertyOverlay.style.borderRadius =
  "0.6rem";

// Compact internal padding.
propertyOverlay.style.padding =
  "0.55rem";

// Keep above the model.
propertyOverlay.style.zIndex =
  "11";

// Slight blur behind the panel.
propertyOverlay.style.backdropFilter =
  "blur(10px)";

// White text.
propertyOverlay.style.color =
  "white";

// Compact base font size.
propertyOverlay.style.fontSize =
  "0.78rem";

// Tight line height.
propertyOverlay.style.lineHeight =
  "1.25";

// Allow interaction.
propertyOverlay.style.pointerEvents =
  "auto";

// Add the panel to the viewport.
viewport.appendChild(
  propertyOverlay,
);

// ============================================================
// END: CREATE PROPERTY PANEL
// ============================================================


// ============================================================
// START: RAW BIM VALUE HELPERS
// ============================================================

// ------------------------------------------------------------
// START: FUNCTION - rawBIMValue()
// ------------------------------------------------------------

const rawBIMValue = (
  value: any,
): any => {

  // No value.
  if (
    value === null ||
    value === undefined
  ) {

    return undefined;

  }

  // Unwrap ThatOpen IFC values.
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(
      value,
      "value",
    )
  ) {

    return value.value;

  }

  return value;
};

// ------------------------------------------------------------
// END: FUNCTION - rawBIMValue()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - getRawBIMField()
// ------------------------------------------------------------

const getRawBIMField = (
  object: any,
  fieldNames: string[],
): any => {

  if (
    !object ||
    typeof object !== "object"
  ) {

    return undefined;

  }

  for (
    const fieldName
    of fieldNames
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        object,
        fieldName,
      )
    ) {

      return rawBIMValue(
        object[fieldName],
      );

    }

  }

  return undefined;
};

// ------------------------------------------------------------
// END: FUNCTION - getRawBIMField()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - formatRawValue()
// ------------------------------------------------------------

const formatRawValue = (
  value: any,
): string => {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  if (
    typeof value === "boolean"
  ) {

    return value
      ? "TRUE"
      : "FALSE";

  }

  if (
    typeof value === "number"
  ) {

    return String(value);

  }

  if (
    typeof value === "string"
  ) {

    return value;

  }

  if (
    Array.isArray(value)
  ) {

    return value
      .map((item) =>
        formatRawValue(item),
      )
      .filter(Boolean)
      .join(", ");

  }

  try {

    return JSON.stringify(
      value,
    );

  } catch {

    return String(value);

  }

};

// ------------------------------------------------------------
// END: FUNCTION - formatRawValue()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - escapeHtml()
// ------------------------------------------------------------

const escapeHtml = (
  value: any,
): string => {

  const text =
    formatRawValue(
      value,
    );

  return text
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );

};

// ------------------------------------------------------------
// END: FUNCTION - escapeHtml()
// ------------------------------------------------------------

// ============================================================
// END: RAW BIM VALUE HELPERS
// ============================================================


// ============================================================
// START: PROPERTY PANEL UI HELPERS
// ============================================================


// ------------------------------------------------------------
// START: FUNCTION - propertyRow()
// ------------------------------------------------------------
//
// Create one compact BIM property row.
//
// Example:
//
// Category       Windows
// Family         Basic Wall
// Type Id        872790
//
// The label and value are kept on the same row to reduce
// unnecessary vertical space.
//
// ------------------------------------------------------------

const propertyRow = (
  label: string,
  value: any,
): string => {

  const formatted =
    formatRawValue(
      value,
    );

  // Don't display empty values.
  if (!formatted) {
    return "";
  }

  return `
    <div
      style="
        display:grid;
        grid-template-columns:minmax(7.5rem, 38%) minmax(0, 1fr);
        column-gap:0.55rem;
        align-items:start;
        padding:0.18rem 0;
        border-bottom:1px solid rgba(255,255,255,0.035);
      "
    >

      <div
        style="
          font-weight:600;
          opacity:0.65;
          font-size:0.72rem;
          line-height:1.2;
        "
      >
        ${escapeHtml(label)}
      </div>

      <div
        style="
          white-space:pre-wrap;
          word-break:break-word;
          font-size:0.76rem;
          line-height:1.25;
        "
      >
        ${escapeHtml(formatted)}
      </div>

    </div>
  `;

};

// ------------------------------------------------------------
// END: FUNCTION - propertyRow()
// ------------------------------------------------------------




// ------------------------------------------------------------
// START: FUNCTION - propertySection()
// ------------------------------------------------------------
//
// Create one major section.
//
// Major sections include:
//
// Element
// PropertySets
// Other
// Constraints
// Dimensions
// Identity Data
// Phasing
// QuantitySets
// BIM Relations
//
// ------------------------------------------------------------

const propertySection = (
  title: string,
  content: string,
): string => {

  // Don't create an empty section.
  if (!content.trim()) {
    return "";
  }

  return `
    <div
      style="
        margin-top:0.45rem;
        padding-top:0.35rem;
        border-top:1px solid rgba(255,255,255,0.10);
      "
    >

      <div
        style="
          font-weight:700;
          margin-bottom:0.2rem;
          font-size:0.78rem;
          line-height:1.2;
        "
      >
        ${escapeHtml(title)}
      </div>

      ${content}

    </div>
  `;

};

// ------------------------------------------------------------
// END: FUNCTION - propertySection()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - propertySubsection()
// ------------------------------------------------------------
//
// Create a compact subsection inside a major section.
//
// This is used for IFC PropertySets:
//
// PropertySets
//
//   Pset_WindowCommon
//   IsExternal      TRUE
//   Reference       600 X 600mm W-03
//
// Unlike propertySection(), this does not add large spacing.
//
// ------------------------------------------------------------

const propertySubsection = (
  title: string,
  content: string,
): string => {

  if (!content.trim()) {
    return "";
  }

  return `
    <div
      style="
        margin-top:0.35rem;
        padding:0.25rem 0 0.15rem 0;
      "
    >

      <div
        style="
          font-weight:650;
          font-size:0.74rem;
          opacity:0.8;
          padding:0.15rem 0 0.2rem 0;
        "
      >
        ${escapeHtml(title)}
      </div>

      ${content}

    </div>
  `;

};

// ------------------------------------------------------------
// END: FUNCTION - propertySubsection()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - setPropertyPanel()
// ------------------------------------------------------------

const setPropertyPanel = (
  html: string,
) => {

  if (!html || !html.trim()) {
    clearPropertyPanel();
    return;
  }

  propertyOverlay.innerHTML = `

    <div
      style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        font-weight:700;
        font-size:0.88rem;
        padding-bottom:0.3rem;
        border-bottom:1px solid rgba(255,255,255,0.10);
      "
    >

      <span>
        Element Properties
      </span>

      <button
        id="property-panel-close"
        type="button"
        style="
          cursor:pointer;
          border:none;
          background:transparent;
          color:rgba(255,255,255,0.75);
          font-size:1rem;
          line-height:1;
          padding:0.1rem 0.25rem;
        "
        title="Close properties"
      >
        ×
      </button>

    </div>

    ${html}

  `;

  propertyOverlay.style.display =
    "block";

  const closeButton =
    propertyOverlay.querySelector(
      "#property-panel-close",
    );

  closeButton?.addEventListener(
    "click",
    () => {
      clearPropertyPanel();
    },
  );

};

// ------------------------------------------------------------
// END: FUNCTION - setPropertyPanel()
// ------------------------------------------------------------



// ------------------------------------------------------------
// START: FUNCTION - clearPropertyPanel()
// ------------------------------------------------------------

const clearPropertyPanel = () => {

  propertyOverlay.innerHTML = "";
  propertyOverlay.style.display = "none";

};

// ------------------------------------------------------------
// END: FUNCTION - clearPropertyPanel()
// ------------------------------------------------------------


// ============================================================
// END: PROPERTY PANEL UI HELPERS
// ============================================================


// ============================================================
// START: PROPERTY DATA ORGANIZATION
// ============================================================


// ------------------------------------------------------------
// START: INTERFACE - PROPERTY DISPLAY DATA
// ------------------------------------------------------------

interface DisplayProperty {
  name: string;
  value: any;
}

// ------------------------------------------------------------
// END: INTERFACE - PROPERTY DISPLAY DATA
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - getPropertyId()
// ------------------------------------------------------------

const getPropertyId = (
  property: any,
): number | undefined => {

  const id =
    getRawBIMField(
      property,
      [
        "_localId",
        "localId",
        "id",
      ],
    );

  return typeof id === "number"
    ? id
    : undefined;
};

// ------------------------------------------------------------
// END: FUNCTION - getPropertyId()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - getPropertyName()
// ------------------------------------------------------------

const getPropertyName = (
  property: any,
  fallbackId?: number,
): string => {

  return (
    getRawBIMField(
      property,
      [
        "Name",
        "name",
      ],
    )
    ??
    (
      fallbackId !== undefined
        ? `Property ${fallbackId}`
        : "Property"
    )
  );

};

// ------------------------------------------------------------
// END: FUNCTION - getPropertyName()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - getPropertyValue()
// ------------------------------------------------------------

const getPropertyValue = (
  property: any,
): any => {

  return getRawBIMField(
    property,
    [
      "NominalValue",
      "nominalValue",
      "Value",
      "value",
    ],
  );

};

// ------------------------------------------------------------
// END: FUNCTION - getPropertyValue()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - buildPropertyMap()
// ------------------------------------------------------------

const buildPropertyMap = (
  properties: any[],
): Map<number, any> => {

  const map =
    new Map<number, any>();

  for (
    const property
    of properties
  ) {

    const id =
      getPropertyId(
        property,
      );

    if (
      id !== undefined
    ) {

      map.set(
        id,
        property,
      );

    }

  }

  return map;
};

// ------------------------------------------------------------
// END: FUNCTION - buildPropertyMap()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - getPropertySetProperties()
// ------------------------------------------------------------

const getPropertySetProperties = (
  propertySet: any,
  result: Awaited<
    ReturnType<typeof queryBIMElement>
  >,
  propertyMap: Map<number, any>,
): DisplayProperty[] => {

  // Get property-set local ID.
  const propertySetId =
    getRawBIMField(
      propertySet,
      [
        "_localId",
        "localId",
        "id",
      ],
    );

  let propertyIds:
    number[] = [];

  // ----------------------------------------------------------
  // START: GET IDS FROM PROPERTY SET RELATIONS
  // ----------------------------------------------------------

  if (
    propertySetId !== undefined &&
    result.propertySetRelations
  ) {

    const relations =
      result.propertySetRelations as any;

    const relation =
      relations?.get?.(
        propertySetId,
      );

    const relatedIds =
      relation?.data?.HasProperties;

    if (
      Array.isArray(
        relatedIds,
      )
    ) {

      propertyIds =
        relatedIds;

    }

  }

  // ----------------------------------------------------------
  // END: GET IDS FROM PROPERTY SET RELATIONS
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: FALLBACK TO RAW PROPERTY SET
  // ----------------------------------------------------------

  if (
    propertyIds.length === 0
  ) {

    const rawIds =
      getRawBIMField(
        propertySet,
        [
          "HasProperties",
          "hasProperties",
        ],
      );

    if (
      Array.isArray(rawIds)
    ) {

      propertyIds =
        rawIds
          .map((id) =>
            Number(id),
          )
          .filter((id) =>
            Number.isFinite(id),
          );

    }

  }

  // ----------------------------------------------------------
  // END: FALLBACK TO RAW PROPERTY SET
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: CONVERT IDS TO PROPERTIES
  // ----------------------------------------------------------

  const properties:
    DisplayProperty[] = [];

  for (
    const propertyId
    of propertyIds
  ) {

    const property =
      propertyMap.get(
        propertyId,
      );

    if (!property) {
      continue;
    }

    properties.push({
      name:
        getPropertyName(
          property,
          propertyId,
        ),

      value:
        getPropertyValue(
          property,
        ),
    });

  }

  // ----------------------------------------------------------
  // END: CONVERT IDS TO PROPERTIES
  // ----------------------------------------------------------

  return properties;
};

// ------------------------------------------------------------
// END: FUNCTION - getPropertySetProperties()
// ------------------------------------------------------------


// ============================================================
// END: PROPERTY DATA ORGANIZATION
// ============================================================


// ============================================================
// START: PROPERTY GROUP CLASSIFICATION
// ============================================================


// ------------------------------------------------------------
// START: FUNCTION - propertyNameMatches()
// ------------------------------------------------------------

const propertyNameMatches = (
  name: string,
  patterns: RegExp[],
): boolean => {

  return patterns.some(
    (pattern) =>
      pattern.test(name),
  );

};

// ------------------------------------------------------------
// END: FUNCTION - propertyNameMatches()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - addGroupedProperty()
// ------------------------------------------------------------
//
// Add a property to a display group.
//
// Duplicate properties are ignored.
//
// This prevents the same BIM property from appearing more than
// once when the same information is encountered through multiple
// raw relations or property sets.
//
// ------------------------------------------------------------

const addGroupedProperty = (
  groups: Record<
    string,
    DisplayProperty[]
  >,
  groupName: string,
  property: DisplayProperty,
) => {

  if (
    !groups[groupName]
  ) {

    groups[groupName] =
      [];

  }

  const alreadyExists =
    groups[groupName].some(
      (existing) =>
        existing.name
          .trim()
          .toLowerCase() ===
          property.name
            .trim()
            .toLowerCase()
        &&
        formatRawValue(
          existing.value,
        ) ===
          formatRawValue(
            property.value,
          ),
    );

  if (alreadyExists) {
    return;
  }

  groups[groupName].push(
    property,
  );

};

// ------------------------------------------------------------
// END: FUNCTION - addGroupedProperty()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - classifyProperty()
// ------------------------------------------------------------

const classifyProperty = (
  property: DisplayProperty,
  groups: Record<
    string,
    DisplayProperty[]
  >,
) => {

  const name =
    property.name.trim();

  // ----------------------------------------------------------
  // CONSTRAINTS
  // ----------------------------------------------------------

  if (
    propertyNameMatches(
      name,
      [
        /^level$/i,
        /sill\s*height/i,
      ],
    )
  ) {

    addGroupedProperty(
      groups,
      "Constraints",
      property,
    );

    return;

  }


  // ----------------------------------------------------------
  // DIMENSIONS
  // ----------------------------------------------------------

  if (
    propertyNameMatches(
      name,
      [
        /^area$/i,
        /^volume$/i,
      ],
    )
  ) {

    addGroupedProperty(
      groups,
      "Dimensions",
      property,
    );

    return;

  }


  // ----------------------------------------------------------
  // IDENTITY DATA
  // ----------------------------------------------------------

  if (
    propertyNameMatches(
      name,
      [
        /^mark$/i,
      ],
    )
  ) {

    addGroupedProperty(
      groups,
      "Identity Data",
      property,
    );

    return;

  }


  // ----------------------------------------------------------
  // PHASING
  // ----------------------------------------------------------

  if (
    propertyNameMatches(
      name,
      [
        /^phase\s*created$/i,
        /^phase$/i,
      ],
    )
  ) {

    addGroupedProperty(
      groups,
      "Phasing",
      property,
    );

    return;

  }


  // ----------------------------------------------------------
  // OTHER
  // ----------------------------------------------------------

  if (
    propertyNameMatches(
      name,
      [
        /^category$/i,
        /^family$/i,
        /^family\s+and\s+type$/i,
        /^type$/i,
        /^type\s+id$/i,
        /^head\s+height$/i,
        /^host\s+id$/i,
      ],
    )
  ) {

    addGroupedProperty(
      groups,
      "Other",
      property,
    );

  }

};

// ------------------------------------------------------------
// END: FUNCTION - classifyProperty()
// ------------------------------------------------------------


// ============================================================
// END: PROPERTY GROUP CLASSIFICATION
// ============================================================


// ============================================================
// START: RENDER PROPERTY SET
// ============================================================


// ------------------------------------------------------------
// START: FUNCTION - renderPropertySet()
// ------------------------------------------------------------
//
// Render one IFC property set as a compact subsection.
//
// Example:
//
// Pset_WindowCommon
// IsExternal      TRUE
// Reference       600 X 600mm W-03
//
// ------------------------------------------------------------

const renderPropertySet = (
  propertySet: any,
  properties: DisplayProperty[],
): string => {

  const propertySetName =
    getRawBIMField(
      propertySet,
      [
        "Name",
        "name",
      ],
    )
    ?? "Property Set";

  let content =
    "";

  for (
    const property
    of properties
  ) {

    content +=
      propertyRow(
        property.name,
        property.value,
      );

  }

  return propertySubsection(
    String(propertySetName),
    content,
  );

};

// ------------------------------------------------------------
// END: FUNCTION - renderPropertySet()
// ------------------------------------------------------------


// ============================================================
// END: RENDER PROPERTY SET
// ============================================================


// ============================================================
// START: RENDER BIM QUERY RESULT
// ============================================================


// ------------------------------------------------------------
// START: FUNCTION - renderBIMQueryResult()
// ------------------------------------------------------------

const renderBIMQueryResult = (
  result: Awaited<
    ReturnType<typeof queryBIMElement>
  >,
) => {

  // ----------------------------------------------------------
  // START: CHECK ELEMENT
  // ----------------------------------------------------------

  if (!result.element) {

    setPropertyPanel(`
      <div
        style="
          margin-top:0.5rem;
          opacity:0.7;
        "
      >
        No BIM element data was found.
      </div>
    `);

    return;

  }

  // ----------------------------------------------------------
  // END: CHECK ELEMENT
  // ----------------------------------------------------------


  // Raw BIM element.
  const element =
    result.element;


  // ==========================================================
  // START: ELEMENT SECTION
  // ==========================================================

  let elementHtml =
    "";


  // ----------------------------------------------------------
  // IFC CLASS
  // ----------------------------------------------------------

  const ifcClass =
    getRawBIMField(
      element,
      [
        "_category",
        "category",
        "Category",
      ],
    );

  elementHtml +=
    propertyRow(
      "IFC Class",
      ifcClass,
    );


  // ----------------------------------------------------------
  // GLOBAL ID
  // ----------------------------------------------------------

  const globalId =
    getRawBIMField(
      element,
      [
        "GlobalId",
        "GlobalID",
        "globalId",
        "globalID",
        "GUID",
        "Guid",
      ],
    );

  elementHtml +=
    propertyRow(
      "GlobalId",
      globalId,
    );


  // ----------------------------------------------------------
  // EXPRESS ID
  // ----------------------------------------------------------

  elementHtml +=
    propertyRow(
      "Express ID",
      result.localId,
    );


  // ----------------------------------------------------------
  // NAME
  // ----------------------------------------------------------

  const elementName =
    getRawBIMField(
      element,
      [
        "Name",
        "name",
      ],
    );

  elementHtml +=
    propertyRow(
      "Name",
      elementName,
    );


  // ----------------------------------------------------------
  // OBJECT TYPE
  // ----------------------------------------------------------

  const objectType =
    getRawBIMField(
      element,
      [
        "ObjectType",
        "objectType",
      ],
    );

  elementHtml +=
    propertyRow(
      "Object Type",
      objectType,
    );


  // ----------------------------------------------------------
  // PREDEFINED TYPE
  // ----------------------------------------------------------

  const predefinedType =
    getRawBIMField(
      element,
      [
        "PredefinedType",
        "predefinedType",
      ],
    );

  elementHtml +=
    propertyRow(
      "Predefined Type",
      predefinedType,
    );


  // ----------------------------------------------------------
  // MODEL ID
  // ----------------------------------------------------------

  elementHtml +=
    propertyRow(
      "Model ID",
      result.modelId,
    );


  // Create Element section.
  let html =
    propertySection(
      "Element",
      elementHtml,
    );

  // ==========================================================
  // END: ELEMENT SECTION
  // ==========================================================


  // ==========================================================
  // START: BUILD PROPERTY MAP
  // ==========================================================

  const propertyMap =
    buildPropertyMap(
      result.properties,
    );

  // ==========================================================
  // END: BUILD PROPERTY MAP
  // ==========================================================


  // ==========================================================
  // START: PROPERTY SETS
  // ==========================================================

  let propertySetsHtml =
    "";

  for (
    const propertySet
    of result.propertySets
  ) {

    const properties =
      getPropertySetProperties(
        propertySet,
        result,
        propertyMap,
      );

    propertySetsHtml +=
      renderPropertySet(
        propertySet,
        properties,
      );

  }

  if (
    propertySetsHtml
  ) {

    html +=
      propertySection(
        "PropertySets",
        propertySetsHtml,
      );

  }

  // ==========================================================
  // END: PROPERTY SETS
  // ==========================================================


  // ==========================================================
  // START: ORGANIZE COMMON BIM INFORMATION
  // ==========================================================

  const groupedProperties:
    Record<
      string,
      DisplayProperty[]
    > = {};


  // ----------------------------------------------------------
  // START: SCAN ALL PROPERTY SET PROPERTIES
  // ----------------------------------------------------------

  for (
    const propertySet
    of result.propertySets
  ) {

    const properties =
      getPropertySetProperties(
        propertySet,
        result,
        propertyMap,
      );

    for (
      const property
      of properties
    ) {

      classifyProperty(
        property,
        groupedProperties,
      );

    }

  }

  // ----------------------------------------------------------
  // END: SCAN ALL PROPERTY SET PROPERTIES
  // ----------------------------------------------------------

  // ==========================================================
  // END: ORGANIZE COMMON BIM INFORMATION
  // ==========================================================


  // ==========================================================
  // START: OTHER SECTION
  // ==========================================================

  let otherHtml =
    "";

  for (
    const property
    of groupedProperties["Other"] ?? []
  ) {

    otherHtml +=
      propertyRow(
        property.name,
        property.value,
      );

  }

  html +=
    propertySection(
      "Other",
      otherHtml,
    );

  // ==========================================================
  // END: OTHER SECTION
  // ==========================================================


  // ==========================================================
  // START: CONSTRAINTS SECTION
  // ==========================================================

  let constraintsHtml =
    "";

  for (
    const property
    of groupedProperties["Constraints"] ?? []
  ) {

    constraintsHtml +=
      propertyRow(
        property.name,
        property.value,
      );

  }

  html +=
    propertySection(
      "Constraints",
      constraintsHtml,
    );

  // ==========================================================
  // END: CONSTRAINTS SECTION
  // ==========================================================


  // ==========================================================
  // START: DIMENSIONS SECTION
  // ==========================================================

  let dimensionsHtml =
    "";

  for (
    const property
    of groupedProperties["Dimensions"] ?? []
  ) {

    dimensionsHtml +=
      propertyRow(
        property.name,
        property.value,
      );

  }

  html +=
    propertySection(
      "Dimensions",
      dimensionsHtml,
    );

  // ==========================================================
  // END: DIMENSIONS SECTION
  // ==========================================================


  // ==========================================================
  // START: IDENTITY DATA SECTION
  // ==========================================================

  let identityHtml =
    "";

  for (
    const property
    of groupedProperties["Identity Data"] ?? []
  ) {

    identityHtml +=
      propertyRow(
        property.name,
        property.value,
      );

  }

  html +=
    propertySection(
      "Identity Data",
      identityHtml,
    );

  // ==========================================================
  // END: IDENTITY DATA SECTION
  // ==========================================================


  // ==========================================================
  // START: PHASING SECTION
  // ==========================================================

  let phasingHtml =
    "";

  for (
    const property
    of groupedProperties["Phasing"] ?? []
  ) {

    phasingHtml +=
      propertyRow(
        property.name,
        property.value,
      );

  }

  html +=
    propertySection(
      "Phasing",
      phasingHtml,
    );

  // ==========================================================
  // END: PHASING SECTION
  // ==========================================================


  // ==========================================================
  // START: QUANTITY SETS
  // ==========================================================
  //
  // Quantity sets are displayed separately from ordinary
  // PropertySets.
  //
  // We do NOT create quantity data here.
  //
  // We only display quantity sets that actually exist in:
  //
  //     result.propertySets
  //
  // If BaseQuantities is present, it will be displayed here.
  //
  // ==========================================================

  let quantitySetsHtml =
    "";

  for (
    const propertySet
    of result.propertySets
  ) {

    const propertySetName =
      String(
        getRawBIMField(
          propertySet,
          [
            "Name",
            "name",
          ],
        )
        ?? "",
      );

    // Detect quantity-related property sets.
    const isQuantitySet =
      /quantity|quantities|basequantities/i
        .test(
          propertySetName,
        );

    if (!isQuantitySet) {
      continue;
    }

    const properties =
      getPropertySetProperties(
        propertySet,
        result,
        propertyMap,
      );

    quantitySetsHtml +=
      renderPropertySet(
        propertySet,
        properties,
      );

  }

  html +=
    propertySection(
      "QuantitySets",
      quantitySetsHtml,
    );

  // ==========================================================
  // END: QUANTITY SETS
  // ==========================================================


  // ==========================================================
  // START: RELATIONS
  // ==========================================================
  //
  // Keep the relationship information compact.
  //
  // The complete raw relationships remain available through
  // the BIM query result for future functionality.
  //
  // ==========================================================

  if (
    result.isDefinedBy.length > 0
  ) {

    html +=
      propertySection(
        "BIM Relations",
        propertyRow(
          "IsDefinedBy",
          result.isDefinedBy.length,
        ),
      );

  }

  // ==========================================================
  // END: RELATIONS
  // ==========================================================


  // ==========================================================
  // START: RENDER FINAL PROPERTY PANEL
  // ==========================================================

  setPropertyPanel(
    html,
  );

  // ==========================================================
  // END: RENDER FINAL PROPERTY PANEL
  // ==========================================================

};

// ------------------------------------------------------------
// END: FUNCTION - renderBIMQueryResult()
// ------------------------------------------------------------


// ============================================================
// END: RENDER BIM QUERY RESULT
// ============================================================


// ============================================================
// START: RUN BIM QUERY
// ============================================================


// ------------------------------------------------------------
// START: FUNCTION - runRawBIMQuery()
// ------------------------------------------------------------

const runRawBIMQuery = async (
  data: any,
) => {

  // ----------------------------------------------------------
  // START: GET MODEL ID
  // ----------------------------------------------------------

  const modelId =
    data?.modelId ??
    data?.model ??
    data?.model_id ??
    data?.modelID;

  // ----------------------------------------------------------
  // END: GET MODEL ID
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: GET LOCAL ID
  // ----------------------------------------------------------

  const localId =
    data?.localId ??
    data?.localID ??
    data?.id ??
    data?.itemId ??
    data?.item;

  // ----------------------------------------------------------
  // END: GET LOCAL ID
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: VALIDATE MODEL ID
  // ----------------------------------------------------------

  if (!modelId) {

    console.warn(
      "BIM QUERY: Could not determine model ID.",
    );

    setPropertyPanel(`
      <div
        style="
          margin-top:0.5rem;
          color:#ff8888;
        "
      >
        Could not determine model ID.
      </div>
    `);

    return;

  }

  // ----------------------------------------------------------
  // END: VALIDATE MODEL ID
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: VALIDATE LOCAL ID
  // ----------------------------------------------------------

  if (
    localId === undefined ||
    localId === null
  ) {

    console.warn(
      "BIM QUERY: Could not determine FRAG local ID.",
    );

    setPropertyPanel(`
      <div
        style="
          margin-top:0.5rem;
          color:#ff8888;
        "
      >
        Could not determine FRAG local ID.
      </div>
    `);

    return;

  }

  // ----------------------------------------------------------
  // END: VALIDATE LOCAL ID
  // ----------------------------------------------------------


  // Convert local ID into a number.
  const numericLocalId =
    Number(localId);

  if (
    !Number.isFinite(
      numericLocalId,
    )
  ) {

    console.warn(
      "BIM QUERY: Invalid local ID:",
      localId,
    );

    setPropertyPanel(`
      <div
        style="
          margin-top:0.5rem;
          color:#ff8888;
        "
      >
        Invalid BIM element ID.
      </div>
    `);

    return;

  }


  // ==========================================================
  // START: SHOW LOADING STATE
  // ==========================================================

  setPropertyPanel(`
    <div
      style="
        margin-top:0.5rem;
        opacity:0.7;
      "
    >
      Loading BIM properties...
    </div>
  `);

  // ==========================================================
  // END: SHOW LOADING STATE
  // ==========================================================


  // ==========================================================
  // START: QUERY BIM DATA
  // ==========================================================

  try {

    const result =
      await queryBIMElement(
        fragments,
        String(modelId),
        numericLocalId,
      );

    renderBIMQueryResult(
      result,
    );

  } catch (error) {

    console.error(
      "BIM QUERY FAILED:",
      error,
    );

    setPropertyPanel(`
      <div
        style="
          margin-top:0.5rem;
          color:#ff8888;
        "
      >

        BIM query failed.

        <br><br>

        ${escapeHtml(
          error instanceof Error
            ? error.message
            : String(error),
        )}

      </div>
    `);

  }

  // ==========================================================
  // END: QUERY BIM DATA
  // ==========================================================

};

// ------------------------------------------------------------
// END: FUNCTION - runRawBIMQuery()
// ------------------------------------------------------------


// ============================================================
// END: RUN BIM QUERY
// ============================================================


// ============================================================
// START: SPATIAL TREE SELECTION + TRANSPARENCY
// ============================================================


// ------------------------------------------------------------
// START: FUNCTION - setMaterialOpacity()
// ------------------------------------------------------------

const setMaterialOpacity = (
  opacity: number,
) => {

  for (
    const [, material]
    of fragments.core.models.materials.list
  ) {

    const mat =
      material as THREE.Material & {
        opacity?: number;
        transparent?: boolean;
        depthWrite?: boolean;
      };

    if ("opacity" in mat) {
      mat.opacity =
        opacity;
    }

    if ("transparent" in mat) {

      mat.transparent =
        opacity < 1;

    }

    // Prevent transparent objects from blocking
    // objects behind them.
    if ("depthWrite" in mat) {

      mat.depthWrite =
        opacity >= 1;

    }

    mat.needsUpdate =
      true;

  }

};

// ------------------------------------------------------------
// END: FUNCTION - setMaterialOpacity()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - applyTreeSelectionVisual()
// ------------------------------------------------------------

const applyTreeSelectionVisual =
  async (
    modelId: string,
    localId: number,
  ) => {

    console.log(
      "[tree selection] Applying visual selection:",
      modelId,
      localId,
    );

    // Clear previous highlight.
    highlighter.clear();

    // Make the entire model transparent.
    setMaterialOpacity(
      0.2,
    );

    // Restore selected element to solid.
    const selection:
      OBC.ModelIdMap = {
        [modelId]:
          new Set([localId]),
      };

    const model =
      fragments.list.get(modelId);

    if (model) {
      await model.setOpacity(
        [localId],
        1,
      );
    }

    // Highlight selected element.
    highlighter.add(
      {
        customId: "tree-selection",
        color: new THREE.Color(0x4c8dff),
        renderedFaces: 0,
        opacity: 1,
        transparent: false,
      },
    );

    highlighter.selection["tree-selection"] =
      selection;

    console.log(
      "[tree selection] Selected element is solid:",
      modelId,
      localId,
    );

  };

// ------------------------------------------------------------
// END: FUNCTION - applyTreeSelectionVisual()
// ------------------------------------------------------------

// ------------------------------------------------------------
// START: FUNCTION - resetSpatialTreeSelection()
// ------------------------------------------------------------

const resetSpatialTreeSelection = () => {

  // Restore the entire model to normal opacity here.  
  setMaterialOpacity(
     1,
  );


};

// ------------------------------------------------------------
// END: FUNCTION - resetSpatialTreeSelection()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: FUNCTION - selectDataFromRow()
// ------------------------------------------------------------

const selectDataFromRow = (
  data: any,
) => {

  console.group(
    "Selected spatial tree row data",
  );

  console.log(
    "row.data:",
    data,
  );

  console.groupEnd();

  const modelId =
    data?.modelId ??
    data?.model ??
    data?.model_id ??
    data?.modelID;

  const localId =
    data?.localId ??
    data?.localID ??
    data?.id ??
    data?.itemId ??
    data?.item;

  if (!modelId) {

    console.warn(
      "[tree selection] Could not determine model ID.",
    );

    return;

  }

  const numericLocalId =
    Number(localId);

  if (
    !Number.isFinite(
      numericLocalId,
    )
  ) {

    console.warn(
      "[tree selection] Invalid local ID:",
      localId,
    );

    return;

  }

  // Keep the spatial tree's own selection state.
  const selection =
    (spatialTree as any)
      .selection;

  if (
    selection &&
    typeof selection.clear ===
      "function"
  ) {

    selection.clear();

  }

  if (
    selection &&
    typeof selection.add ===
      "function"
  ) {

    selection.add(
      data,
    );

  }

  // Apply visual selection.
  void applyTreeSelectionVisual(
    String(modelId),
    numericLocalId,
  );

  // Query BIM data and update the property panel.
  void runRawBIMQuery(
    data,
  );

};

// ------------------------------------------------------------
// END: FUNCTION - selectDataFromRow()
// ------------------------------------------------------------


// ------------------------------------------------------------
// START: SPATIAL TREE CLICK EVENT
// ------------------------------------------------------------

// ------------------------------------------------------------
// START: FUNCTION - initializeSpatialTreeSelection()
// ------------------------------------------------------------
//
// This listener is intentionally PERMANENT.
//
// Selecting an item in the spatial tree is what drives the BIM
// query and property panel, so it must not be removed when the
// user activates a temporary tool like the clipper.
//
// This is a CORE application listener, not a temporary tool
// listener.

const initializeSpatialTreeSelection = () => {

  spatialTree.addEventListener(
    "click",
    (event: Event) => {

      const path =
        (event as any)
          .composedPath?.() ?? [];

      const row =
        path.find(
          (node: unknown) =>
            node instanceof HTMLElement &&
            node.tagName.toLowerCase() ===
              "bim-table-row",
        ) as any | undefined;

      if (
        !row ||
        row.hasAttribute(
          "is-header",
        ) ||
        row.table !== spatialTree
      ) {
        return;
      }

      if (row.data) {
        selectDataFromRow(
          row.data,
        );
      }

    },
  );

}; // END: initializeSpatialTreeSelection()
// END: FUNCTION - initializeSpatialTreeSelection()
// ------------------------------------------------------------

// Initialize the spatial-tree selection once.
//
// DO NOT register this through switchControlPanelSection().
// The property panel depends on this listener and must survive
// changes between temporary control-panel tools.
initializeSpatialTreeSelection();

// ============================================================
// END: SPATIAL TREE SELECTION + TRANSPARENCY
// ============================================================


// ============================================================
// START: CLIPPER TOOL TOGGLE BUTTON
// ============================================================

const clipperToggleButton =
  BUI.Component.create(
    () => BUI.html`
      <bim-button
        label=${clipperEnabled
          ? "Disable Clipper Tool"
          : "Enable Clipper Tool"}
      ></bim-button>
    `,
  );

// ------------------------------------------------------------
// START: FUNCTION - activateClipperSection()
// ------------------------------------------------------------

const activateClipperSection = () => {

  const controller = new AbortController();

  // Double-click creates a clipping plane.
  viewport.addEventListener(
    "dblclick",
    () => {

      if (clipper.enabled) {
        clipper.create(world);
      }

    },
    { signal: controller.signal },
  );

  // Delete/Backspace removes the clipping plane under the pointer.
  window.addEventListener(
    "keydown",
    (event) => {

      if (
        (event.code === "Delete" ||
          event.code === "Backspace") &&
        clipper.enabled
      ) {
        clipper.delete(world);
      }

    },
    { signal: controller.signal },
  );

  return () => {
    controller.abort();
  };

};

// ------------------------------------------------------------
// END: FUNCTION - activateClipperSection()
// ------------------------------------------------------------

clipperToggleButton.addEventListener(
  "click",
  () => {

    clipperEnabled =
      !clipperEnabled;

    clipper.enabled =
      clipperEnabled;

    clipper.config.enabled =
      clipperEnabled;

    clipperToggleButton.setAttribute(
      "label",
      clipperEnabled
        ? "Disable Clipper Tool"
        : "Enable Clipper Tool",
    );

    updateClipperStatusLabel();

    if (clipperEnabled) {
      switchControlPanelSection(
        activateClipperSection,
      );
    } else {
      cleanupActiveControlPanelSection();
    }

  },
);

// ============================================================
// END: CLIPPER TOOL TOGGLE BUTTON
// ============================================================


// ============================================================
// START: LEFT CONTROL PANEL
// ============================================================

const panel =
  BUI.Component.create(
    () => {

      const [loadFragBtn] =
        BUIC.buttons.loadFrag({
          components,
        });

      // The spatial-tree selection listener is a permanent core
      // application listener. Loading the model does not need to
      // switch the temporary control-panel lifecycle.
      loadFragBtn.addEventListener(
        "click",
        () => {
          // The permanent spatial-tree selection listener is already
          // active. The load button only loads the model.
        },
      );

      return BUI.html`

        <bim-panel
          label="BIM Controller Layout"
        >

          <bim-panel-section
            label="Measurement Tools"
          >
            <div
              style="
                display:flex;
                flex-direction:column;
                gap:0.5rem;
              "
            >
              <bim-button
                id="measurement-toggle-button"
                label="Open measurement tool"
                @click=${() => {
                  const controls = document.getElementById("measurement-controls");
                  if (!controls) return;

                  const isHidden = controls.style.display === "none";

                  if (!isHidden) {
                    closeMeasurementTool();
                  }

                  controls.style.display = isHidden ? "flex" : "none";

                  const toggleButton = document.getElementById("measurement-toggle-button") as BUI.Button | null;
                  if (toggleButton) {
                    toggleButton.setAttribute(
                      "label",
                      isHidden ? "Close measurement tool" : "Open measurement tool",
                    );
                  }
                }}
              >
              </bim-button>

              <div
                id="measurement-controls"
                style="display:none; flex-direction:column; gap:0.5rem;"
              >
                <bim-button
                  label="Measure Line"
                  @click=${() => setActiveMeasurementTool("line")}
                >
                </bim-button>

                <bim-button
                  label="Measure Area"
                  @click=${() => setActiveMeasurementTool("area")}
                >
                </bim-button>

                <bim-button
                  label="Measure Volume"
                  @click=${() => setActiveMeasurementTool("volume")}
                >
                </bim-button>

                <bim-button
                  label="Clear All Measurements"
                  @click=${clearAllMeasurements}
                >
                </bim-button>
              </div>
            </div>
          </bim-panel-section>

          <bim-panel-section
            label="Model Spatial Tree"
          >

            ${loadFragBtn}

            <div
              style="
                display:flex;
                gap:0.5rem;
                align-items:center;
              "
            >

              <bim-text-input
                style="flex:1;"
                id="tree-search-input"
                placeholder="Search tree..."
              >
              </bim-text-input>

              <bim-button
                label="Search"
                @click=${() => {

                  const input =
                    document.getElementById(
                      "tree-search-input",
                    ) as BUI.TextInput | null;

                  if (input) {

                    spatialTree.queryString =
                      input.value;

                  }

                }}
              >
              </bim-button>

              <bim-button
                label="Clear"
                @click=${() => {

                  const input =
                    document.getElementById(
                      "tree-search-input",
                    ) as BUI.TextInput | null;

                  if (input) {

                    input.value =
                      "";

                  }

                  spatialTree.queryString =
                    "";

                }}
              >
              </bim-button>

              <bim-button
                label="Reset"
                @click=${() => {
                resetViewer();
                }}
              >
              </bim-button>


            </div>

            ${spatialTree}

          </bim-panel-section>


          <bim-panel-section
            label="Show and Hide IFC Spaces"
          >

            <div
              style="
                display:flex;
                flex-direction:column;
                gap:0.5rem;
              "
            >

              <bim-button
                label="Debug IFC spaces"
                @click=${() => {
                  void debugIfcSpaces();
                }}
              >
              </bim-button>

              <bim-button
                label="Toggle IFC space visibility"
                @click=${toggleIfcSpacesVisibility}
              >
              </bim-button>

            </div>

          </bim-panel-section>


          <bim-panel-section
            label="Model Clipper Settings"
          >

            <bim-label>
              Instruction: Double-click model to cut.
              Press "Delete" over a plane to clear it.
            </bim-label>

            ${clipperToggleButton}

            <bim-checkbox
              label="Show Section Outlines"
              checked
              @change="${({
                target,
              }: {
                target: BUI.Checkbox
              }) => {

                clipper.config.visible =
                  target.value;

              }}"
            >
            </bim-checkbox>

            <bim-color-input
              label="Planes Border Color"
              color="#202932"
              @input="${({
                target,
              }: {
                target: BUI.ColorInput
              }) => {

                clipper.config.color =
                  new THREE.Color(
                    target.color,
                  );

              }}"
            >
            </bim-color-input>

            <bim-button
              label="Toggle Active Cuts"
              @click=${toggleClippings}
            >
            </bim-button>

            <bim-button
              label="Clear All Section Planes"
              style="
                background-color:#ff4d4d;
                color:white;
              "
              @click="${() => {
                clipper.deleteAll();
              }}"
            >
            </bim-button>

          </bim-panel-section>


          <bim-panel-section
            label="Floor / Level Visibility"
          >

            <bim-label>
              Toggle IFC storey visibility after
              the model loads.
            </bim-label>

            <div
              style="
                display:flex;
                flex-direction:column;
                gap:0.5rem;
              "
            >
              ${floorControlList}
            </div>

          </bim-panel-section>


          <bim-panel-section
            label="Element Type Visibility"
          >

            <bim-label>
              Element Type Visibility
            </bim-label>

            ${elementTypeListContainer}

          </bim-panel-section>

        </bim-panel>

      `;

    },
  );

// ============================================================
// END: LEFT CONTROL PANEL
// ============================================================

// ============================================================
// START: APPLICATION GRID LAYOUT
// ============================================================

const app =
  document.getElementById(
    "app",
  ) as BUI.Grid<["main"]>;

app.layouts = {

  main: {

    template: `
      "panel viewport"
      / 30rem 1fr
    `,

    elements: {
      panel,
      viewport,
    },

  },

};

app.layout =
  "main";

// ============================================================
// END: APPLICATION GRID LAYOUT
// ============================================================


// ============================================================
// START: MEASUREMENT TOOL FEATURE
// ============================================================

type MeasurementKind =
  "line" |
  "area" |
  "volume";

type MeasurementTool =
  | OBCF.LengthMeasurement
  | OBCF.AreaMeasurement
  | OBCF.VolumeMeasurement;

const measurementTools: Record<
  MeasurementKind,
  MeasurementTool
> = {
  line: new OBCF.LengthMeasurement(components),
  area: new OBCF.AreaMeasurement(components),
  volume: new OBCF.VolumeMeasurement(components),
};

const setMeasurementDefaults = (
  kind: MeasurementKind,
  tool: MeasurementTool,
) => {
  const toolAny = tool as any;

  toolAny.world = world;
  toolAny.enabled = false;
  toolAny.visible = false;
  toolAny.mode = "free";
  toolAny.lineType = "fat";
  toolAny.lineWidth = 2;

  if (kind === "line") {
    toolAny.units = "m";
    toolAny.color =
      new THREE.Color("#2563eb");
  }

  if (kind === "area") {
    toolAny.units = "m2";
    toolAny.color =
      new THREE.Color("#16a34a");
    toolAny.mode = "face";
  }

  if (kind === "volume") {
    toolAny.units = "m3";
    toolAny.color =
      new THREE.Color("#7c3aed");
  }
};

for (const [kind, tool] of Object.entries(
  measurementTools,
) as [MeasurementKind, MeasurementTool][]) {
  setMeasurementDefaults(kind, tool);
}

measurementTools.area.mode = "face";
measurementTools.line.rounding = 2;
measurementTools.area.rounding = 2;
measurementTools.volume.rounding = 2;

let activeTool: MeasurementTool | null =
  null;

function clearAllMeasurements() {
  for (const tool of Object.values(
    measurementTools,
  )) {
    tool.list.clear();
    tool.cancelCreation();
  }
}

function setActiveMeasurementTool(
  kind: MeasurementKind,
) {
  activeTool = measurementTools[kind];

  for (const [key, tool] of Object.entries(
    measurementTools,
  ) as [MeasurementKind, MeasurementTool][]) {
    const isActive = key === kind;

    tool.cancelCreation();
    tool.enabled = isActive;
    tool.visible = isActive;
  }
}

function closeMeasurementTool() {
  if (activeTool) {
    activeTool.cancelCreation();
  }

  for (const tool of Object.values(
    measurementTools,
  )) {
    tool.cancelCreation();
    tool.enabled = false;
    tool.visible = false;
  }

  activeTool = null;
}

const viewportCanvas =
  world.renderer.three.domElement as HTMLCanvasElement;

viewportCanvas.addEventListener(
  "pointerdown",
  async (event) => {
    if (event.button !== 0) return;
    if (!activeTool) return;

    await activeTool.create();
  },
);

window.addEventListener(
  "keydown",
  (event) => {
    if (!activeTool) return;

    if (event.key === "Escape") {
      activeTool.cancelCreation();
    }

    if (event.key === "Delete") {
      activeTool.list.clear();
    }
  },
);

// ============================================================
// END: MEASUREMENT TOOL FEATURE
// ============================================================