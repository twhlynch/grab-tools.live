const vertexShader = /*glsl*/`

varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform mat3 worldNormalMatrix;

void main()
{
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vNormal = worldNormalMatrix * normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const fragmentShader = /*glsl*/`

varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform vec3 colors;
uniform float opacity;
uniform sampler2D colorTexture;
uniform float tileFactor;

uniform float sunSize;
uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform vec4 specularColor;

uniform bool isSelected;

const float gamma = 0.5;

void main()
{
    vec4 color = vec4(colors, opacity);
    vec3 blendNormals = abs(vNormal);
    vec3 texSample;
    vec4 adjustment = vec4(1.0, 1.0, 1.0, 1.0);

    if(blendNormals.x > blendNormals.y && blendNormals.x > blendNormals.z)
    {
        texSample = texture2D(colorTexture, vWorldPosition.zy * tileFactor).rgb;
    }
    else if(blendNormals.y > blendNormals.z)
    {
        texSample = texture2D(colorTexture, vWorldPosition.xz * tileFactor).rgb;
    }
    else
    {
        texSample = texture2D(colorTexture, vWorldPosition.xy * tileFactor).rgb;
    }

    texSample = pow(texSample, vec3(1.0 / gamma));

    color.rgb *= texSample * adjustment.rgb;

    //Apply sun light

    vec3 cameraToVertex = vWorldPosition - cameraPosition;
    float distanceToCamera = length(cameraToVertex);
    cameraToVertex = normalize(cameraToVertex);

    vec3 lightDirection = normalize(-sunDirection);

    float light = dot(normalize(vNormal), lightDirection);
    float finalLight = clamp(light, 0.0, 1.0);
    float lightFactor = finalLight;
    lightFactor -= clamp(-light * 0.15, 0.0, 1.0);

    vec3 halfVector = normalize((-sunDirection - cameraToVertex));
    float lightSpecular = clamp(dot(normalize(vNormal), halfVector), 0.0, 1.0);

    color.rgb = 0.5 * color.rgb + sunColor * clamp(sunSize * 0.7 + 0.3, 0.0, 1.0) * (color.rgb * lightFactor + pow(lightSpecular, specularColor.a) * specularColor.rgb * finalLight);
    if (isSelected) {
        color.rgb = mix(color.rgb, vec3(0.3, 1.0, 0.3), 0.05);
    }
    gl_FragColor = LinearTosRGB(color);
}`;
const startFinishVS = /*glsl*/`
varying vec2 vTexcoord;

void main()
{
    vTexcoord = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const startFinishFS = /*glsl*/`
varying vec2 vTexcoord;

uniform vec4 diffuseColor;

void main()
{
    vec4 color = diffuseColor;
    float factor = vTexcoord.y;
    factor *= factor * factor;
    factor = clamp(factor, 0.0, 1.0);
    color.a = factor;

    gl_FragColor = color;
}`;

export { vertexShader, fragmentShader, startFinishVS, startFinishFS };