precision mediump float;
varying vec2 vTextureCoord;
varying vec4 vColor;
uniform float dist;
uniform int tint;
uniform sampler2D uSampler;

const int SAMPLE = 3;

void main(void) {

vec4 orig = texture2D(uSampler, vTextureCoord);
	vec4 sum = vec4(0.0);
	vec4 glow = vec4(0.0);

	float near = 1.0 - dist;


	// Blur thing

	float gap = 1.0 * 3.0/1280.0;
	float samples = (float(SAMPLE * SAMPLE) * 4.0);

	for(int x = 0; x < SAMPLE; x++) {
		for(int y = 0; y < SAMPLE; y++) {
			sum += texture2D(uSampler, vec2(vTextureCoord.x - float(x) * gap, vTextureCoord.y - float(y) * gap)) / samples;
			sum += texture2D(uSampler, vec2(vTextureCoord.x + float(x) * gap, vTextureCoord.y - float(y) * gap)) / samples;
			sum += texture2D(uSampler, vec2(vTextureCoord.x - float(x) * gap, vTextureCoord.y + float(y) * gap)) / samples;
			sum += texture2D(uSampler, vec2(vTextureCoord.x + float(x) * gap, vTextureCoord.y + float(y) * gap)) / samples;
		}
	}
	
	sum = mix(sum, orig, near * near);


	// Colors

	float grey = (sum.x + sum.y + sum.z) / 3.0;
	//float colorness = abs(grey - sum.x) + abs(grey - sum.y) + abs(grey - sum.z);
	//bool isSnow = (colorness < 0.07 && grey > 0.1);

	// fade
	sum = mix(sum, vec4(grey, grey, grey, 1.0), dist * 2.0);

	// blue tint
	if(tint == 0)
		sum.x = clamp(sum.x + 0.2, 0.0, 1.0);
	else
		sum.x = clamp(sum.x * (1.4 - dist), 0.0, 1.0);

	if(tint == 1)
		sum.y = clamp(sum.y + 0.2, 0.0, 1.0);
	else
		sum.y = clamp(sum.y * (1.4 - dist), 0.0, 1.0);

	if(tint == 2)
		sum.z = clamp(sum.z + 0.2, 0.0, 1.0);
	else	
		sum.z = clamp(sum.z * (1.4 - dist), 0.0, 1.0);

	// darken
	sum = mix(sum, vec4(0.0, 0.0, 0.0, 1.0), dist);

	// debug
	/*if(isSnow) {
		//sum = mix(sum, vec4(1.0, 1.0, 1.0, 1.0), float(isSnow));
		//sum = mix(sum, blur, pow(clamp(near, 16.0));
	}*/

	gl_FragColor = sum;
}