precision mediump float;
varying vec2 vTextureCoord;
varying vec4 vColor;
uniform float posX;
uniform float posY;
uniform sampler2D uSampler;

const int SAMPLE = 3;

void main(void) {

	vec4 orig = texture2D(uSampler, vTextureCoord);
	vec4 sum = vec4(0.0);
	vec4 glow = vec4(0.0);

	vec2 pos = vec2(posX / 1280.0, (720.0 - posY) / 720.0);
	float dist = distance(vTextureCoord, pos);
	float near = 1.0 - dist;


	// Blur thing

	float gap = 1.0 * 3.0/1280.0;
	float samples = (float(SAMPLE * SAMPLE) * 4.0);

	float redness = 0.0;

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
	/*float nonRedness = abs(grey - sum.y) + abs(grey - sum.z);
	bool isSnow = (sum.x > 0.7 && nonRedness < 0.3);*/

	// fade
	//sum = mix(sum, vec4(grey, grey, grey, 1.0), dist * 2.0);

	// blue tint
	vec4 tint = vec4(0.0, 0.0, 0.0, 1.0);
	tint.x = clamp(sum.x + 0.2, 0.0, 1.0);
	tint.y = clamp(sum.y * (0.8), 0.0, 1.0);
	tint.z = clamp(sum.z * (0.8), 0.0, 1.0);

	sum = tint;

	// darken
	sum = mix(sum, vec4(0.0, 0.0, 0.0, 1.0), dist * 1.5);

	// highlight
	/*if(redness == 1.0)
		sum = mix(sum, vec4(1.0, 1.0, 1.0, 1.0), grey);
*/
	// debug
	//if(isSnow) {
		//sum = mix(sum, vec4(1.0, 0.4, 0.4, 1.0), min(redness / 10.0, 1.0));
		//sum = mix(sum, blur, pow(clamp(near, 16.0));
	//}*/

	gl_FragColor = sum;
}