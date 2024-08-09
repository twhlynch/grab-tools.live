export const skyVS = `
	varying vec3 vWorldPosition;

	void main()
	{
		vec3 rotatedPosition = (modelViewMatrix * vec4(position, 0.0)).xyz;
		gl_Position = projectionMatrix * vec4(rotatedPosition, 0.0);
		gl_Position.z = gl_Position.w;

		vWorldPosition = position;
	}`

export const skyFS = `
	varying vec3 vWorldPosition;

	uniform vec3 cameraFogColor0;
	uniform vec3 cameraFogColor1;
	uniform float sunSize;

	uniform vec3 sunColor;
	uniform vec3 sunDirection;

	void main()
	{
		vec3 cameraToVertex = normalize(vWorldPosition);

		float horizonFactor = 1.0 - clamp(abs(cameraToVertex.y) / 0.8, 0.0, 1.0);
		vec3 fogColor = mix(cameraFogColor1.rgb, cameraFogColor0.rgb, horizonFactor * horizonFactor);
		vec4 color = vec4(fogColor, 1.0);

		float sunAngle = acos(dot(sunDirection, -cameraToVertex));
		float realSunSize = 0.05 * sunSize;
		float sunGlowSize = sunSize;
		float sunFactor = clamp((sunGlowSize - sunAngle) / sunGlowSize, 0.0, 1.0);
		sunFactor *= sunFactor;
		if(sunAngle < realSunSize) sunFactor = 1.5;
		color.rgb = mix(color.rgb, sunColor, sunFactor);

		gl_FragColor = color;
		#include <colorspace_fragment>
	}`

export const levelVS = `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    uniform mat3 worldNormalMatrix;

    void main()
    {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;

        vNormal = worldNormalMatrix * normal;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`

export const levelFS = `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    uniform sampler2D colorTexture;
    uniform float tileFactor;
    uniform vec3 diffuseColor;
    uniform float neonEnabled;
	uniform float isTransparent;
    uniform float fogEnabled;

    uniform vec2 cameraFogDistance;
    uniform vec3 cameraFogColor0;
	uniform vec3 cameraFogColor1;
	uniform float sunSize;
	uniform vec3 sunColor;
	uniform vec3 sunDirection;
	uniform vec4 specularColor;

	uniform bool isSelected;

    void main()
    {
        vec4 color = vec4(0.0, 0.0, 0.0, 1.0);

        vec3 blendNormals = abs(vNormal);
        if(blendNormals.x > blendNormals.y && blendNormals.x > blendNormals.z)
        {
            color.rgb = texture2D(colorTexture, vWorldPosition.zy * tileFactor).rgb;
        }
        else if(blendNormals.y > blendNormals.z)
        {
            color.rgb = texture2D(colorTexture, vWorldPosition.xz * tileFactor).rgb;
        }
        else
        {
            color.rgb = texture2D(colorTexture, vWorldPosition.xy * tileFactor).rgb;
        }

        color.rgb *= diffuseColor;

        vec3 cameraToVertex = vWorldPosition - cameraPosition;
	    float distanceToCamera = length(cameraToVertex);
	    cameraToVertex = normalize(cameraToVertex);

		if(neonEnabled < 0.5)
		{
			//Apply sun light
	        vec3 lightDirection = normalize(-sunDirection);

	        float light = dot(normalize(vNormal), lightDirection);
	        float finalLight = clamp(light, 0.0, 1.0);
	        float lightFactor = finalLight;
	        lightFactor -= clamp(-light * 0.15, 0.0, 1.0);

			vec3 halfVector = normalize((-sunDirection - cameraToVertex));
			float lightSpecular = clamp(dot(normalize(vNormal), halfVector), 0.0, 1.0);

			color.rgb = 0.5 * color.rgb + sunColor * clamp(sunSize * 0.7 + 0.3, 0.0, 1.0) * (color.rgb * lightFactor + pow(lightSpecular, specularColor.a) * specularColor.rgb * finalLight);
		}

        //Fog
        if(fogEnabled > 0.5)
        {
            float horizonFactor = 1.0 - clamp(abs(cameraToVertex.y) / 0.8, 0.0, 1.0);
            vec3 fogColor = mix(cameraFogColor1.rgb, cameraFogColor0.rgb, horizonFactor * horizonFactor);

            float sunAngle = acos(dot(sunDirection, -cameraToVertex));
            float sunSize_ = 0.05 * sunSize;
            float sunGlowSize = sunSize;
            float sunFactor = clamp((sunGlowSize - sunAngle) / sunGlowSize, 0.0, 1.0);
            sunFactor *= sunFactor;
            fogColor = mix(fogColor, sunColor, sunFactor);

            float fogAmount = clamp((1.0 - exp(-distanceToCamera * cameraFogDistance.x)) * cameraFogDistance.y, 0.0, 1.0);
            color.rgb = mix(color.rgb, fogColor, fogAmount * fogAmount);
        }

		if (isSelected) {
			color.rgb = mix(color.rgb, vec3(0.3, 1.0, 0.3), 0.05);
		}

		color.a = isTransparent > 0.5 ? 0.5 : 1.0;

        gl_FragColor = color;

   		#include <colorspace_fragment>
    }`

export const startFinishVS = `
	varying vec2 vTexcoord;
	varying vec3 vWorldPosition;

	void main()
	{
		vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;

		vTexcoord = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}`

export const startFinishFS = `
	varying vec2 vTexcoord;
	varying vec3 vWorldPosition;

	uniform vec4 diffuseColor;

	uniform float fogEnabled;
    uniform vec2 cameraFogDistance;
    uniform vec3 cameraFogColor0;
	uniform vec3 cameraFogColor1;
	uniform float sunSize;
	uniform vec3 sunColor;
	uniform vec3 sunDirection;

	void main()
	{
		vec4 color = diffuseColor;
		float factor = vTexcoord.y;
		factor *= factor * factor;
		factor = clamp(factor, 0.0, 1.0);
		color.a = factor;

		//Fog
        if(fogEnabled > 0.5)
        {
        	vec3 cameraToVertex = vWorldPosition - cameraPosition;
        	float distanceToCamera = length(cameraToVertex);
        	cameraToVertex = normalize(cameraToVertex);

            float horizonFactor = 1.0 - clamp(abs(cameraToVertex.y) / 0.8, 0.0, 1.0);
            vec3 fogColor = mix(cameraFogColor1.rgb, cameraFogColor0.rgb, horizonFactor * horizonFactor);

            float sunAngle = acos(dot(sunDirection, -cameraToVertex));
            float sunSize_ = 0.05 * sunSize;
            float sunGlowSize = sunSize;
            float sunFactor = clamp((sunGlowSize - sunAngle) / sunGlowSize, 0.0, 1.0);
            sunFactor *= sunFactor;
            fogColor = mix(fogColor, sunColor, sunFactor);

            float fogAmount = clamp((1.0 - exp(-distanceToCamera * cameraFogDistance.x)) * cameraFogDistance.y, 0.0, 1.0);
            color.rgb = mix(color.rgb, fogColor, fogAmount * fogAmount);
        }

		gl_FragColor = color;
	}`

export const signVS = `
	varying vec2 vTexcoord;
	varying vec3 vNormal;
	varying vec3 vWorldPosition;

	void main()
	{
		vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;

		vec4 worldNormal = modelMatrix * vec4(normal, 0.0);
		vNormal = worldNormal.xyz;

		vTexcoord = uv;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}`

export const signFS = `
	varying vec2 vTexcoord;
	varying vec3 vNormal;
	varying vec3 vWorldPosition;

	uniform sampler2D colorTexture;

	uniform float fogEnabled;
    uniform vec2 cameraFogDistance;
    uniform vec3 cameraFogColor0;
	uniform vec3 cameraFogColor1;
	uniform float sunSize;
	uniform vec3 sunColor;
	uniform vec3 sunDirection;
	uniform vec4 specularColor;

	void main()
	{
		vec4 color = texture2D(colorTexture, vTexcoord);

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

        //Fog
        if(fogEnabled > 0.5)
        {
            float horizonFactor = 1.0 - clamp(abs(cameraToVertex.y) / 0.8, 0.0, 1.0);
            vec3 fogColor = mix(cameraFogColor1.rgb, cameraFogColor0.rgb, horizonFactor * horizonFactor);

            float sunAngle = acos(dot(sunDirection, -cameraToVertex));
            float sunSize_ = 0.05 * sunSize;
            float sunGlowSize = sunSize;
            float sunFactor = clamp((sunGlowSize - sunAngle) / sunGlowSize, 0.0, 1.0);
            sunFactor *= sunFactor;
            fogColor = mix(fogColor, sunColor, sunFactor);

            float fogAmount = clamp((1.0 - exp(-distanceToCamera * cameraFogDistance.x)) * cameraFogDistance.y, 0.0, 1.0);
            color.rgb = mix(color.rgb, fogColor, fogAmount * fogAmount);
        }

		gl_FragColor = color;
		#include <colorspace_fragment>
	}`
