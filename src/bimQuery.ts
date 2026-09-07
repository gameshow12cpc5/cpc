// ============================================================
// START: IMPORTS
// ============================================================

// Import ThatOpen Components.
//
// We use this type to access the Fragments Manager and
// communicate with the loaded FRAG model.
import * as OBC from "@thatopen/components";

// ============================================================
// END: IMPORTS
// ============================================================


// ============================================================
// START: BIM QUERY RESULT INTERFACE
// ============================================================

/**
 * Describes the raw BIM information returned by queryBIMElement().
 *
 * IMPORTANT:
 *
 * This interface describes DATA, not UI.
 *
 * This file does not decide:
 * - how the information is displayed
 * - what the property panel looks like
 * - how properties are named
 * - how values are formatted
 *
 * It simply returns the BIM information that was found.
 */
export interface BIMQueryResult {

  // ----------------------------------------------------------
  // START: ELEMENT IDENTIFICATION
  // ----------------------------------------------------------

  // ID of the FRAG model containing the element.
  modelId: string;

  // Local ID used by the FRAG model to identify the element.
  localId: number;

  // ----------------------------------------------------------
  // END: ELEMENT IDENTIFICATION
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: RAW ELEMENT DATA
  // ----------------------------------------------------------

  // Raw IFC/FRAG data for the selected element.
  //
  // Example:
  // IFCWINDOW
  // IFCWALL
  // IFCDOOR
  //
  // The actual object can contain many raw IFC attributes.
  element: any | null;

  // ----------------------------------------------------------
  // END: RAW ELEMENT DATA
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: RAW RELATION DATA
  // ----------------------------------------------------------

  // Raw relationships belonging to the selected element.
  //
  // These relationships tell us how the element is connected
  // to other IFC objects.
  relations: any | null;

  // Raw relations belonging to each IFC property set.
  //
  // For example:
  //
  // IFCPROPERTYSET
  //      ↓
  // HasProperties
  //      ↓
  // IFC properties
  propertySetRelations: any;

  // ----------------------------------------------------------
  // END: RAW RELATION DATA
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: PROPERTY SET REFERENCES
  // ----------------------------------------------------------

  // IDs referenced by the element's IsDefinedBy relationship.
  //
  // These IDs may point to IFC property sets or other
  // IFC relationship objects.
  isDefinedBy: number[];

  // Raw IFC property set objects found through IsDefinedBy.
  propertySets: any[];

  // Local IDs of the IFC property sets.
  propertySetIds: number[];

  // ----------------------------------------------------------
  // END: PROPERTY SET REFERENCES
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // START: PROPERTY REFERENCES
  // ----------------------------------------------------------

  // Raw IFC property objects contained inside the property sets.
  properties: any[];

  // Local IDs of the IFC properties.
  propertyIds: number[];

  // ----------------------------------------------------------
  // END: PROPERTY REFERENCES
  // ----------------------------------------------------------

}

// ============================================================
// END: BIM QUERY RESULT INTERFACE
// ============================================================


// ============================================================
// START: QUERY BIM ELEMENT
// ============================================================

/**
 * Query one FRAG element and return its raw BIM data.
 *
 * The process is:
 *
 * 1. Find the FRAG model.
 * 2. Get the selected element.
 * 3. Get the element's relations.
 * 4. Find its IsDefinedBy references.
 * 5. Find the IFC property sets.
 * 6. Get the property-set relations.
 * 7. Find the properties inside those property sets.
 * 8. Return all of the raw information.
 *
 * IMPORTANT:
 *
 * This function deliberately does NOT:
 *
 * - format values
 * - rename IFC attributes
 * - interpret IFC attributes
 * - create HTML
 * - build the property panel
 *
 * This is the RAW BIM DATA LAYER.
 */
export async function queryBIMElement(
  fragments: OBC.FragmentsManager,
  modelId: string,
  localId: number,
): Promise<BIMQueryResult> {

  // ==========================================================
  // START: FIND FRAG MODEL
  // ==========================================================

  // Ask the Fragments Manager for the loaded model.
  //
  // modelId identifies which loaded FRAG model we want.
  const model = fragments.list.get(modelId);

  // Make sure the requested model actually exists.
  //
  // If it doesn't exist, there is nothing we can query.
  if (!model) {
    throw new Error(`Model "${modelId}" was not found.`);
  }

  // ==========================================================
  // END: FIND FRAG MODEL
  // ==========================================================


  // ==========================================================
  // START: GET RAW ELEMENT DATA
  // ==========================================================

  // Ask the FRAG model for the raw data of the selected element.
  //
  // getItemsData() expects an array of local IDs.
  //
  // We are querying one element, so the array contains
  // only one ID.
  const elementData = await model.getItemsData([localId]);

  // Get the first returned element.
  //
  // If nothing was returned, use null instead.
  const element = elementData[0] ?? null;

  // If the element doesn't exist, return an empty BIM result.
  //
  // This allows the caller to handle a missing element without
  // trying to process undefined data.
  if (!element) {

    return {
      modelId,
      localId,

      element: null,
      relations: null,

      propertySetRelations: null,

      isDefinedBy: [],

      propertySets: [],
      propertySetIds: [],

      properties: [],
      propertyIds: [],
    };

  }

  // ==========================================================
  // END: GET RAW ELEMENT DATA
  // ==========================================================


  // ==========================================================
  // START: GET ELEMENT RELATIONS
  // ==========================================================

  // Get all relationships belonging to the selected element.
  //
  // Relationships are important because IFC information is
  // often connected through references rather than being stored
  // directly on the element.
  const relations = await model.getRelations([localId]);

  // Get the relationship information specifically for our
  // selected local ID.
  const elementRelations = relations.get(localId);

  // Get the raw relationship data.
  //
  // If no relationship data exists, use an empty object.
  const rawRelations = elementRelations?.data ?? {};

  // ==========================================================
  // END: GET ELEMENT RELATIONS
  // ==========================================================


  // ==========================================================
  // START: GET ISDEFINEDBY REFERENCES
  // ==========================================================

  // IsDefinedBy is one of the important IFC relationships used
  // to connect an element to property definitions.
  //
  // Example conceptually:
  //
  // Element
  //    ↓
  // IsDefinedBy
  //    ↓
  // Property Set
  //    ↓
  // HasProperties
  //    ↓
  // Property
  //
  // If the element doesn't have IsDefinedBy data, use [].
  const isDefinedBy =
    rawRelations.IsDefinedBy ?? [];

  // ==========================================================
  // END: GET ISDEFINEDBY REFERENCES
  // ==========================================================


  // ==========================================================
  // START: GET ISDEFINEDBY OBJECT DATA
  // ==========================================================

  // IsDefinedBy contains IDs.
  //
  // We now ask the FRAG model for the actual objects represented
  // by those IDs.
  const relatedData =
    isDefinedBy.length > 0
      ? await model.getItemsData(isDefinedBy)
      : [];

  // ==========================================================
  // END: GET ISDEFINEDBY OBJECT DATA
  // ==========================================================


  // ==========================================================
  // START: FIND IFC PROPERTY SETS
  // ==========================================================

  // Create an empty list that will contain the local IDs of
  // actual IFC property sets.
  const propertySetIds: number[] = [];

  // Look through every object referenced by IsDefinedBy.
  for (const id of isDefinedBy) {

    // Find the raw object belonging to this ID.
    const data = relatedData.find(
      (item: any) =>
        item?._localId?.value === id,
    );

    // Only keep objects whose IFC category is IFCPROPERTYSET.
    //
    // IsDefinedBy can contain relationships to other objects,
    // so we specifically identify property sets here.
    if (
      (data as any)?._category?.value ===
      "IFCPROPERTYSET"
    ) {

      propertySetIds.push(id);

    }

  }

  // ==========================================================
  // END: FIND IFC PROPERTY SETS
  // ==========================================================


  // ==========================================================
  // START: GET PROPERTY SET OBJECTS
  // ==========================================================

  // Keep the actual raw property-set objects.
  //
  // This is useful later when the property panel needs to know
  // things such as the property set name.
  const propertySets = relatedData.filter(
    (item: any) =>
      (item as any)?._category?.value ===
      "IFCPROPERTYSET",
  );

  // ==========================================================
  // END: GET PROPERTY SET OBJECTS
  // ==========================================================


  // ==========================================================
  // START: GET PROPERTY SET RELATIONS
  // ==========================================================

  // Property sets themselves have relationships.
  //
  // One of the important relationships is:
  //
  // HasProperties
  //
  // which points from the property set to the individual
  // IFC property objects.
  const propertySetRelations =
    propertySetIds.length > 0
      ? await model.getRelations(propertySetIds)
      : new Map();

  // ==========================================================
  // END: GET PROPERTY SET RELATIONS
  // ==========================================================


  // ==========================================================
  // START: COLLECT PROPERTY IDS
  // ==========================================================

  // Create an empty list for all property IDs.
  const propertyIds: number[] = [];

  // Go through every property set relation.
  for (const [, relation] of propertySetRelations) {

    // Get the property IDs stored in HasProperties.
    const ids =
      relation.data?.HasProperties ?? [];

    // Add each property ID to our master list.
    for (const id of ids) {

      // Prevent the same property from being added twice.
      if (!propertyIds.includes(id)) {
        propertyIds.push(id);
      }

    }

  }

  // ==========================================================
  // END: COLLECT PROPERTY IDS
  // ==========================================================


  // ==========================================================
  // START: GET RAW PROPERTY OBJECTS
  // ==========================================================

  // Now that we have the property IDs, ask the FRAG model
  // for the actual raw property objects.
  const properties =
    propertyIds.length > 0
      ? await model.getItemsData(propertyIds)
      : [];

  // ==========================================================
  // END: GET RAW PROPERTY OBJECTS
  // ==========================================================


  // ==========================================================
  // START: RETURN RAW BIM RESULT
  // ==========================================================

  // Return everything the caller needs.
  //
  // Notice that we are not formatting any of the data here.
  //
  // The property panel in main.ts will decide how this
  // information should be displayed.
  return {

    // --------------------------------------------------------
    // START: ELEMENT IDENTIFICATION
    // --------------------------------------------------------

    modelId,
    localId,

    // --------------------------------------------------------
    // END: ELEMENT IDENTIFICATION
    // --------------------------------------------------------


    // --------------------------------------------------------
    // START: RAW ELEMENT
    // --------------------------------------------------------

    element,

    // --------------------------------------------------------
    // END: RAW ELEMENT
    // --------------------------------------------------------


    // --------------------------------------------------------
    // START: RAW RELATIONS
    // --------------------------------------------------------

    relations: rawRelations,

    // --------------------------------------------------------
    // END: RAW RELATIONS
    // --------------------------------------------------------


    // --------------------------------------------------------
    // START: PROPERTY SET RELATIONS
    // --------------------------------------------------------

    propertySetRelations,

    // --------------------------------------------------------
    // END: PROPERTY SET RELATIONS
    // --------------------------------------------------------


    // --------------------------------------------------------
    // START: PROPERTY SET INFORMATION
    // --------------------------------------------------------

    isDefinedBy,

    propertySets,

    propertySetIds,

    // --------------------------------------------------------
    // END: PROPERTY SET INFORMATION
    // --------------------------------------------------------


    // --------------------------------------------------------
    // START: PROPERTY INFORMATION
    // --------------------------------------------------------

    properties,

    propertyIds,

    // --------------------------------------------------------
    // END: PROPERTY INFORMATION
    // --------------------------------------------------------

  };

  // ==========================================================
  // END: RETURN RAW BIM RESULT
  // ==========================================================

}

// ============================================================
// END: QUERY BIM ELEMENT
// ============================================================