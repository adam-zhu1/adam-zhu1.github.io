/**
 * The object is one Points mesh. The vertex shader owns every transition:
 * intro assembly, the four scroll morphs, breathing, and the hover pull toward a hub node.
 */

export const vertexShader = /* glsl */ `
  attribute vec3 aScatter;
  attribute vec3 aBlob;
  attribute vec3 aRibbon;
  attribute vec3 aStars;
  attribute vec3 aTerrain;
  attribute float aRand;

  uniform float uIntro;         // 0 scattered, 1 assembled
  uniform float uP;             // scroll progress 0..1
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uAspect;
  uniform vec2 uMouse;          // NDC
  uniform vec3 uHover;          // world position of hovered node
  uniform float uHoverStrength;

  varying float vAlpha;
  varying float vGlow;
  varying float vRand;

  mat3 rotY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  }

  void main() {
    // Per-particle stagger so morphs ripple through the mass instead of snapping.
    float p = clamp(uP + (aRand - 0.5) * 0.05, 0.0, 1.0);
    float w1 = smoothstep(0.06, 0.28, p);  // blob    -> ribbon
    float w2 = smoothstep(0.34, 0.54, p);  // ribbon  -> stars
    float w3 = smoothstep(0.64, 0.82, p);  // stars   -> terrain
    float w4 = smoothstep(0.88, 1.00, p);  // terrain -> blob

    vec3 pos = aBlob;
    pos = mix(pos, aRibbon, w1);
    pos = mix(pos, aStars, w2);
    pos = mix(pos, aTerrain, w3);
    pos = mix(pos, aBlob, w4);

    // The blob turns slowly; the other states hold still.
    float blobW = clamp((1.0 - w1) + w4, 0.0, 1.0);
    pos = rotY(uTime * 0.12 * blobW) * pos;

    // Breathing.
    pos += 0.035 * vec3(
      sin(uTime * 0.7 + aRand * 31.0),
      cos(uTime * 0.9 + aRand * 17.0),
      sin(uTime * 0.5 + aRand * 53.0)
    );

    // Pull toward the hovered hub node.
    vec3 d = uHover - pos;
    float dl = length(d);
    pos += d * uHoverStrength * exp(-dl * 1.6) * 0.42;

    // Intro: assemble from the scatter cloud, staggered.
    float ip = clamp((uIntro - aRand * 0.35) / 0.65, 0.0, 1.0);
    ip = 1.0 - pow(1.0 - ip, 3.0);
    pos = mix(aScatter, pos, ip);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.35 + 1.3 * aRand * aRand) * (4.5 / -mv.z);

    vec2 ndc = gl_Position.xy / gl_Position.w;
    float md = distance(ndc * vec2(uAspect, 1.0), uMouse * vec2(uAspect, 1.0));
    vGlow = exp(-md * md * 5.0);

    vAlpha = (0.25 + 0.75 * ip) * (0.55 + 0.45 * aRand);
    vRand = aRand;
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vAlpha;
  varying float vGlow;
  varying float vRand;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * 1.6;
    vec3 col = mix(uColorA, uColorB, vRand) * (1.0 + 0.35 * vGlow);
    gl_FragColor = vec4(col, a * vAlpha * (0.62 + 0.8 * vGlow));
  }
`;
