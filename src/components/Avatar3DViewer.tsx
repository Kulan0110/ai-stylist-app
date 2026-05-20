import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const ACCENT = '#7c6af5';
const BG     = '#0a0a14';

function buildViewerHtml(glbUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0a0a14;overflow:hidden;touch-action:none}
canvas{display:block}
#overlay{
  position:fixed;top:0;left:0;right:0;bottom:0;
  background:#0a0a14;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  font-family:system-ui;color:#7c6af5;font-size:13px;text-align:center;padding:20px;
  z-index:10;
}
#hint{
  position:fixed;bottom:20px;left:0;right:0;text-align:center;
  color:rgba(124,106,245,0.55);font:11px system-ui;pointer-events:none;letter-spacing:0.5px;
}
#err{color:#f87171;font-size:13px;display:none}
.spinner{
  width:44px;height:44px;border-radius:50%;
  border:3px solid rgba(124,106,245,0.2);
  border-top-color:#7c6af5;
  animation:spin 0.9s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>

<div id="overlay">
  <div class="spinner"></div>
  <span id="loadMsg">3D аватар ачаалж байна...</span>
  <span id="err"></span>
</div>

<canvas id="c"></canvas>
<div id="hint">← хуруугаа чирч 360° эргүүл →</div>

<script src="https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.155.0/examples/js/loaders/GLTFLoader.js"></script>
<script>
(function() {
  var GLB_URL = ${JSON.stringify(glbUrl)};

  var canvas  = document.getElementById('c');
  var overlay = document.getElementById('overlay');
  var loadMsg = document.getElementById('loadMsg');
  var errEl   = document.getElementById('err');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a14);
  scene.fog = new THREE.FogExp2(0x0a0a14, 0.04);

  var aspect = window.innerWidth / window.innerHeight;
  var camera = new THREE.PerspectiveCamera(32, aspect, 0.01, 100);
  camera.position.set(0, 1.5, 3.0);
  camera.lookAt(0, 1.0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  var key = new THREE.DirectionalLight(0xfff8f0, 1.8);
  key.position.set(2, 5, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  var fill = new THREE.DirectionalLight(0xd0e8ff, 0.7);
  fill.position.set(-3, 3, 2);
  scene.add(fill);

  var rim = new THREE.DirectionalLight(0xffeedd, 0.5);
  rim.position.set(0, 4, -4);
  scene.add(rim);

  var ground = new THREE.Mesh(
    new THREE.CircleGeometry(2.5, 64),
    new THREE.MeshBasicMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.6 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  var theta  = 0, phi = 1.45, radius = 3.0, targetY = 1.0;
  var touching = false, lastX = 0, lastY = 0, pinchDist = 0;

  function updateCamera() {
    camera.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi) + targetY,
      radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(0, targetY, 0);
  }

  document.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) { touching = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
    if (e.touches.length === 2) pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  });

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (e.touches.length === 1 && touching) {
      theta -= (e.touches[0].clientX - lastX) * 0.012;
      phi = Math.max(0.35, Math.min(2.55, phi + (e.touches[0].clientY - lastY) * 0.009));
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }
    if (e.touches.length === 2) {
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      radius = Math.max(1.2, Math.min(6.0, radius - (d - pinchDist) * 0.008));
      pinchDist = d;
    }
    updateCamera();
  }, { passive: false });

  document.addEventListener('touchend', function() { touching = false; });

  if (typeof THREE.GLTFLoader === 'undefined') {
    errEl.textContent = 'Three.js GLTFLoader ачаалагдсангүй.';
    errEl.style.display = 'block';
    loadMsg.style.display = 'none';
  } else {
    var loader = new THREE.GLTFLoader();
    loader.load(GLB_URL,
      function(gltf) {
        var model = gltf.scene;
        model.traverse(function(node) { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
        var box = new THREE.Box3().setFromObject(model);
        var center = box.getCenter(new THREE.Vector3());
        var size = box.getSize(new THREE.Vector3());
        model.position.x -= center.x; model.position.z -= center.z; model.position.y -= box.min.y;
        var h = size.y; targetY = h * 0.52; radius = Math.max(2.0, h * 1.7); phi = 1.45; updateCamera();
        scene.add(model);
        if (gltf.animations && gltf.animations.length > 0) { var mixer = new THREE.AnimationMixer(model); mixer.clipAction(gltf.animations[0]).play(); window.__rpm_mixer = mixer; }
        overlay.style.display = 'none';
      },
      function(xhr) { if (xhr.total > 0) loadMsg.textContent = Math.round(xhr.loaded / xhr.total * 100) + '% ачаалагдлаа...'; },
      function(error) { loadMsg.style.display = 'none'; errEl.textContent = 'GLB ачаалахад алдаа гарлаа.'; errEl.style.display = 'block'; }
    );
  }

  var autoRotate = true;
  document.addEventListener('touchstart', function() { autoRotate = false; });

  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();
    if (window.__rpm_mixer) window.__rpm_mixer.update(delta);
    if (autoRotate) { theta += 0.004; updateCamera(); }
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  });

  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'viewerReady' }));
})();
</script>
</body>
</html>`;
}

interface Props {
  glbUrl: string;
  onClose: () => void;
}

export default function Avatar3DViewer({ glbUrl, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  function onMessage(e: any) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'viewerReady') setLoading(false);
    } catch {}
  }

  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <View style={S.header}>
        <Text style={S.title}>🎭  3D Аватар</Text>
        <TouchableOpacity style={S.closeBtn} onPress={onClose}>
          <Text style={S.closeTx}>✕ Хаах</Text>
        </TouchableOpacity>
      </View>

      <View style={S.webWrap}>
        {loading && (
          <View style={S.overlay}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={S.loadTx}>3D аватар ачаалж байна...</Text>
          </View>
        )}
        {error && (
          <View style={S.overlay}>
            <Text style={S.errTx}>Ачааллахад алдаа гарлаа.{'\n'}Интернэт холболтоо шалгана уу.</Text>
            <TouchableOpacity style={S.retryBtn} onPress={() => { setError(false); setLoading(true); }}>
              <Text style={S.retryTx}>Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && (
          <WebView
            source={{ html: buildViewerHtml(glbUrl), baseUrl: 'https://readyplayer.me' }}
            style={S.webView}
            onLoadEnd={() => {}}
            onMessage={onMessage}
            onError={() => { setLoading(false); setError(true); }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            originWhitelist={['*']}
            androidLayerType="hardware"
            mixedContentMode="always"
            scrollEnabled={false}
          />
        )}
      </View>

      <View style={S.controlsBar}>
        <Text style={S.controlsTx}>⟵  чирнэ: эргүүлэх  ·  хоёр хуруу: zoom</Text>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#16162a',
    borderBottomWidth: 1, borderBottomColor: 'rgba(124,106,245,0.22)',
  },
  title:   { fontSize: 15, fontWeight: '800', color: '#e8e8f0' },
  closeBtn:{ backgroundColor: 'rgba(124,106,245,0.15)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(124,106,245,0.3)' },
  closeTx: { fontSize: 12, fontWeight: '700', color: ACCENT },

  webWrap: { flex: 1, position: 'relative' },
  webView: { flex: 1, backgroundColor: BG },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
    gap: 16, zIndex: 10, padding: 24,
  },
  loadTx:  { fontSize: 14, color: ACCENT, fontWeight: '600' },
  errTx:   { fontSize: 14, color: '#fca5a5', textAlign: 'center', lineHeight: 22 },
  retryBtn:{ backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  retryTx: { fontSize: 14, fontWeight: '800', color: '#fff' },

  controlsBar: {
    backgroundColor: '#16162a', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(124,106,245,0.15)',
    alignItems: 'center',
  },
  controlsTx: { fontSize: 11, color: 'rgba(124,106,245,0.6)', letterSpacing: 0.3 },
});
