float3    dot3LightDirection     : register(c0);
float4    dot3LightDiffuseColor  : register(c1);
float4    dot3LightSpecularColor : register(c2);
float4    textureFactor          : register(c3);
float4    textureFactor2         : register(c4);
float4    materialSpecularColor  : register(c5);
float     materialSpecularPower  : register(c6);
float4    alphaFadeOpacityHolder : register(c7);
float4    userConstants[17]      : register(c8);

static const float bloomSpecularRgbScale = 0.5;
static const float bloomSpecularAlphaScale = 0.65;

#define alphaFadeOpacityEnabled alphaFadeOpacityHolder.r
#define bloomEnabled            alphaFadeOpacityHolder.g
#define alphaFadeOpacity        alphaFadeOpacityHolder.a
#define bloomEnabled        	alphaFadeOpacityHolder.g
