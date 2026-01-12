// ======================================================================
// functions.inc
// HLSL pixel shader functions
// ======================================================================

#include "../../shared_program/functions.inc"

// ======================================================================

float calculateFakeAnisotropicSpecularLighting(float dot3SpecularNoPower)
{
	float tighten = 1.25f;
	float powerScale = 0.15f;
	return max(0, pow(1 - abs(1 - (dot3SpecularNoPower * tighten)), materialSpecularPower * powerScale) - powerScale);
}

// ======================================================================
