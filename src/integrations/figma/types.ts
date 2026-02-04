/**
 * Figma API Types
 *
 * Types for Figma REST API responses.
 * Based on: https://www.figma.com/developers/api
 */

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponentMeta>;
  componentSets: Record<string, FigmaComponentSetMeta>;
  styles: Record<string, FigmaStyleMeta>;
  schemaVersion: number;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  visible?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: BoundingBox;
  absoluteRenderBounds?: BoundingBox;
  constraints?: Constraints;
  relativeTransform?: Transform;
  size?: Vector;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  effects?: Effect[];
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  blendMode?: BlendMode;
  opacity?: number;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  layoutGrow?: number;
  componentPropertyDefinitions?: Record<string, ComponentPropertyDefinition>;
  componentPropertyReferences?: Record<string, string>;
  // Text-specific
  characters?: string;
  style?: TypeStyle;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<string, TypeStyle>;
  // Description for frames (design spec)
  description?: string;
}

export type FigmaNodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'SECTION'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'TEXT'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'LINE'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'POLYGON'
  | 'SLICE'
  | 'STICKY'
  | 'SHAPE_WITH_TEXT'
  | 'CONNECTOR'
  | 'WIDGET'
  | 'STAMP'
  | 'HIGHLIGHT'
  | 'WASHI_TAPE'
  | 'TABLE'
  | 'TABLE_CELL';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Constraints {
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
}

export type Transform = [[number, number, number], [number, number, number]];

export interface Vector {
  x: number;
  y: number;
}

export interface Paint {
  type:
    | 'SOLID'
    | 'GRADIENT_LINEAR'
    | 'GRADIENT_RADIAL'
    | 'GRADIENT_ANGULAR'
    | 'GRADIENT_DIAMOND'
    | 'IMAGE'
    | 'EMOJI'
    | 'VIDEO';
  visible?: boolean;
  opacity?: number;
  color?: RGBA;
  blendMode?: BlendMode;
  gradientHandlePositions?: Vector[];
  gradientStops?: GradientStop[];
  scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH';
  imageRef?: string;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface GradientStop {
  position: number;
  color: RGBA;
}

export type BlendMode =
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

export interface Effect {
  type: 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible?: boolean;
  radius: number;
  color?: RGBA;
  blendMode?: BlendMode;
  offset?: Vector;
  spread?: number;
}

export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listSpacing?: number;
  italic?: boolean;
  fontWeight: number;
  fontSize: number;
  textCase?: 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED' | 'ORIGINAL';
  textDecoration?: 'STRIKETHROUGH' | 'UNDERLINE' | 'NONE';
  textAutoResize?: 'HEIGHT' | 'WIDTH_AND_HEIGHT' | 'NONE' | 'TRUNCATE';
  textAlignHorizontal?: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing: number;
  fills?: Paint[];
  lineHeightPx: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit?: 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%';
}

export interface ComponentPropertyDefinition {
  type: 'BOOLEAN' | 'INSTANCE_SWAP' | 'TEXT' | 'VARIANT';
  defaultValue: string | boolean;
  variantOptions?: string[];
  preferredValues?: PreferredValue[];
}

export interface PreferredValue {
  type: 'COMPONENT' | 'COMPONENT_SET';
  key: string;
}

export interface FigmaComponentMeta {
  key: string;
  name: string;
  description: string;
  documentationLinks?: DocumentationLink[];
  remote?: boolean;
  componentSetId?: string;
}

export interface FigmaComponentSetMeta {
  key: string;
  name: string;
  description: string;
  documentationLinks?: DocumentationLink[];
}

export interface DocumentationLink {
  uri: string;
}

export interface FigmaStyleMeta {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  remote?: boolean;
  description: string;
}

export interface FigmaNodesResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  nodes: Record<
    string,
    {
      document: FigmaNode;
      components: Record<string, FigmaComponentMeta>;
      styles: Record<string, FigmaStyleMeta>;
    }
  >;
}

export interface FigmaImagesResponse {
  images: Record<string, string | null>;
  err: string | null;
}

export interface FigmaStylesResponse {
  status: number;
  error: boolean;
  meta: {
    styles: FigmaStyleMeta[];
  };
}

export interface FigmaComponentsResponse {
  status: number;
  error: boolean;
  meta: {
    components: FigmaComponentMeta[];
  };
}

/**
 * Options for Figma integration
 */
export interface FigmaIntegrationOptions {
  /** Mode of operation */
  mode?: 'spec' | 'tokens' | 'components' | 'assets';
  /** Output format for tokens */
  tokenFormat?: 'css' | 'scss' | 'json' | 'tailwind';
  /** Framework for component generation */
  framework?: 'react' | 'vue' | 'svelte' | 'astro' | 'nextjs' | 'nuxt' | 'html';
  /** Node IDs to fetch (comma-separated) */
  nodeIds?: string;
  /** Export format for assets */
  assetFormat?: 'svg' | 'png' | 'pdf' | 'jpg';
  /** Scale for image exports */
  scale?: number;
  /** Project name/ID for filtering */
  project?: string;
  /** Label/tag filter */
  label?: string;
  /** Status filter */
  status?: string;
  /** Maximum items to fetch */
  limit?: number;
}
