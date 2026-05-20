import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar,
  ScrollView, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WardrobeItem } from '../types';

const ACCENT = '#7c6af5';
const BG     = '#0a0a14';
const CARD   = '#1a1a2e';
const BORDER = 'rgba(124,106,245,0.22)';

const COLOR_HEX: Record<string, string> = {
  White:'#F0F0F0', Black:'#1C1C1C', Red:'#C0392B', Blue:'#2471A3',
  Navy:'#1B3A6B', Green:'#1E8449', Yellow:'#D4AC0D', Pink:'#C0477D',
  Purple:'#7D3C98', Grey:'#7F8C8D', Gray:'#7F8C8D', Olive:'#6B7535',
  Brown:'#795548', Khaki:'#C9A46A', Cream:'#F5F0DC', Indigo:'#3F51B5',
  Charcoal:'#424242', Orange:'#E67E22', Teal:'#17A589', Beige:'#F5DEB3',
  'White/Purple':'#9575CD',
};

function toHex(colorName: string): string {
  if (!colorName) return '#888888';
  const key = Object.keys(COLOR_HEX).find(k =>
    k.toLowerCase() === colorName.toLowerCase()
  );
  return key ? COLOR_HEX[key] : '#888888';
}

function layerToRole(layer: string): string | null {
  if (['Base Layer','Mid Layer','Outerwear'].includes(layer)) return 'shirt';
  if (layer === 'Bottom')   return 'pants';
  if (layer === 'Footwear') return 'shoes';
  return null;
}

const ITEM_EMOJI: Record<string, string> = {
  'T-Shirt':'👕','Hoodie':'🧥','Puffer Jacket':'🥼','Denim Jacket':'🧥',
  'Cargo Pants':'👖','Jogger Pants':'👖','Snow Boots':'🥾','Sneakers':'👟',
  'Beanie':'🧢','Turtleneck':'👕',
};

const HAIR_COLORS  = ['#2C1810','#1a1a1a','#8B6914','#C4651A','#E8C99A','#808080','#F4C2C2'];
const SKIN_COLORS  = ['#FDDBB4','#F5CBA7','#E8A87C','#C68642','#8D5524','#4A2912'];

interface TabConfig { key: string; label: string; emoji: string; }
const TABS: TabConfig[] = [
  { key:'tops',    label:'Дээд',  emoji:'👕' },
  { key:'bottoms', label:'Доод',  emoji:'👖' },
  { key:'shoes',   label:'Гутал', emoji:'👟' },
  { key:'hair',    label:'Үс',    emoji:'💇' },
  { key:'skin',    label:'Арьс',  emoji:'🤚' },
];

const DEFAULTS = { shirt:'#111111', pants:'#C9A46A', shoes:'#CC1F1F', hair:'#2C1810', skin:'#FDDBB4' };

const VIEWER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0a0a14;overflow:hidden;touch-action:none}
canvas{display:block;position:fixed;top:0;left:0;width:100%;height:100%}
#overlay{position:fixed;inset:0;background:#0a0a14;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:system-ui;color:#7c6af5;font-size:14px;z-index:20;transition:opacity .4s}
#overlay.gone{opacity:0;pointer-events:none}
.sp{width:44px;height:44px;border-radius:50%;border:3px solid rgba(124,106,245,.2);border-top-color:#7c6af5;animation:sp .9s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
#hint{position:fixed;top:8px;left:0;right:0;text-align:center;color:rgba(124,106,245,.45);font:10px system-ui;pointer-events:none}
</style>
</head>
<body>
<div id="overlay"><div class="sp"></div><span>3D аватар ачаалж байна...</span></div>
<canvas id="c"></canvas>
<div id="hint">← чирэх: эргэх · 2 хуруу: zoom</div>
<script src="https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min.js"></script>
<script>
(function(){
var D={shirt:'#111111',pants:'#C9A46A',shoes:'#CC1F1F',hair:'#2C1810',skin:'#FDDBB4'};
var mats={shirt:null,pants:null,shoes:null,hair:[],skin:null};
var W=window.innerWidth,H=window.innerHeight;
var canvas=document.getElementById('c');
var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true});
renderer.setSize(W,H);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
var scene=new THREE.Scene();scene.background=new THREE.Color(0x0a0a14);
var camera=new THREE.PerspectiveCamera(36,W/H,.01,100);
camera.position.set(0,.3,3.6);camera.lookAt(0,.15,0);
scene.add(new THREE.AmbientLight(0xffffff,.42));
var key=new THREE.DirectionalLight(0xfff5d5,1.7);key.position.set(3,6,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
var fill=new THREE.DirectionalLight(0xd2e5ff,.6);fill.position.set(-3,3,2);scene.add(fill);
var rim=new THREE.DirectionalLight(0xffeedd,.5);rim.position.set(0,4,-5);scene.add(rim);
function toonGrad(n){var d=new Uint8Array(4*n);for(var i=0;i<n;i++){var v=Math.round(i/(n-1)*255);d[i*4]=d[i*4+1]=d[i*4+2]=v;d[i*4+3]=255;}var t=new THREE.DataTexture(d,n,1);t.needsUpdate=true;t.minFilter=t.magFilter=THREE.NearestFilter;return t;}
var gm=toonGrad(4);
function mkMat(hex){return new THREE.MeshToonMaterial({color:new THREE.Color(hex),gradientMap:gm});}
function basic(hex){return new THREE.MeshBasicMaterial({color:new THREE.Color(hex)});}
function ol(mesh,t){var m=new THREE.Mesh(mesh.geometry,new THREE.MeshBasicMaterial({color:0x111111,side:THREE.BackSide}));m.scale.setScalar(1+(t||.010));mesh.add(m);}
function mk(parent,geo,mat,pos,sh){var m=new THREE.Mesh(geo,mat);if(pos)m.position.set(pos[0],pos[1],pos[2]);if(sh)m.castShadow=true;parent.add(m);return m;}
mats.shirt=mkMat(D.shirt);mats.pants=mkMat(D.pants);mats.shoes=mkMat(D.shoes);mats.skin=mkMat(D.skin);
var hairMat=mkMat(D.hair);mats.hair=[hairMat];
var shoeAccMat=new THREE.MeshBasicMaterial({color:0xF2F2F2});
var root=new THREE.Group();root.rotation.y=-.30;scene.add(root);
var refs={};
var grd=new THREE.Mesh(new THREE.CircleGeometry(2,64),new THREE.MeshBasicMaterial({color:0x1a1a2e,transparent:true,opacity:.5}));
grd.rotation.x=-Math.PI/2;grd.position.y=-1.20;scene.add(grd);
(function build(){
  for(var s of[-1,1]){var sg=new THREE.Group();sg.position.set(s*.115,-1.065,.045);root.add(sg);var b=mk(sg,new THREE.BoxGeometry(.178,.20,.395),mats.shoes,[0,0,0],true);ol(b,.014);mk(sg,new THREE.BoxGeometry(.190,.058,.415),shoeAccMat,[0,-.125,0]);var col=mk(sg,new THREE.CylinderGeometry(.09,.09,.068,14),mats.shoes,[0,.128,0]);ol(col,.011);for(var i=0;i<4;i++)mk(sg,new THREE.BoxGeometry(.152,.008,.008),basic('#ffffff'),[0,-.042+i*.047,.200]);}
  for(var x of[-.115,.115]){var sh=mk(root,new THREE.CylinderGeometry(.058,.054,.22,12),mats.skin,[x,-.80,0]);ol(sh,.009);}
  var pants=mk(root,new THREE.CylinderGeometry(.228,.198,.54,16),mats.pants,[0,-.48,0],true);ol(pants,.011);
  mk(root,new THREE.CylinderGeometry(.235,.232,.058,16),mkMat('#A87A30'),[0,-.205,0]);
  refs.torso=mk(root,new THREE.CylinderGeometry(.208,.198,.545,16),mats.shirt,[0,.09,0],true);ol(refs.torso,.011);
  mk(root,new THREE.CylinderGeometry(.218,.210,.056,16),mats.shirt,[0,-.175,0]);
  mk(root,new THREE.CircleGeometry(.08,32),basic('#7c6af5'),[0,.12,.213]);
  for(var s of[-1,1]){var xB=s*.250;var sl=mk(root,new THREE.CylinderGeometry(.075,.065,.165,10),mats.shirt,[xB,.196,0],true);sl.rotation.z=s*-.10;ol(sl,.009);var ua=mk(root,new THREE.CylinderGeometry(.058,.052,.21,10),mats.skin,[xB,.055,0],true);ua.rotation.z=s*-.10;ol(ua,.009);var la=mk(root,new THREE.CylinderGeometry(.046,.040,.34,10),mats.skin,[xB+(s*.020),-.078,s===1?.06:0],true);la.rotation.set(s===1?.25:0,0,s===1?.40:s*-.12);ol(la,.009);var hd=mk(root,new THREE.SphereGeometry(.050,12,12),mats.skin,[xB+(s*.024),s===1?-.215:-.255,s===1?.12:0]);hd.scale.set(1,.78,.90);ol(hd,.009);}
  refs.neck=mk(root,new THREE.CylinderGeometry(.058,.072,.118,14),mats.skin,[0,.418,0]);ol(refs.neck,.008);
  var headG=new THREE.Group();headG.position.y=.648;root.add(headG);refs.headGroup=headG;
  var head=mk(headG,new THREE.SphereGeometry(.192,30,30),mats.skin,[0,0,0],true);head.scale.set(1,.955,.975);ol(head,.012);
  for(var bx of[-.122,.122]){var bl=mk(headG,new THREE.SphereGeometry(.055,12,12),new THREE.MeshToonMaterial({color:0xFFB0A0,transparent:true,opacity:.45,gradientMap:gm}),[bx,-.038,.166]);bl.scale.z=.28;}
  for(var ep of[[-.075,.040],[.075,.040]]){var eg=new THREE.Group();eg.position.set(ep[0],ep[1],.159);headG.add(eg);mk(eg,new THREE.SphereGeometry(.044,18,18),basic('#F9F9F9'));mk(eg,new THREE.SphereGeometry(.030,14,14),basic('#4A3728'),[0,0,.018]);mk(eg,new THREE.SphereGeometry(.020,12,12),basic('#0f0f0f'),[0,0,.028]);mk(eg,new THREE.SphereGeometry(.009,8,8),basic('#ffffff'),[.015,.013,.040]);}
  for(var bp of[[-.077,.18],[.077,-.18]]){var bw=mk(headG,new THREE.TorusGeometry(.025,.008,4,8),hairMat,[bp[0],.100,.178]);bw.scale.set(1.2,.4,.5);bw.rotation.z=bp[1];}
  var ns=mk(headG,new THREE.SphereGeometry(.018,10,10),mats.skin,[0,-.026,.186]);ns.scale.set(1.1,.84,.82);
  mk(headG,new THREE.TorusGeometry(.038,.0085,6,14,Math.PI*.66),basic('#C86644'),[0,-.080,.175]).rotation.set(.22,0,Math.PI+.48);
  var hc=mk(headG,new THREE.SphereGeometry(.204,28,28,0,Math.PI*2,0,Math.PI*.54),hairMat,[0,.004,0],true);ol(hc,.012);
  for(var hs of[[-.122,.12],[.122,-.12]]){var hside=mk(headG,new THREE.SphereGeometry(.148,22,22),hairMat,[hs[0],-.072,.005],true);hside.scale.set(.60,1.10,.68);hside.rotation.z=hs[1];ol(hside,.010);}
  mk(headG,new THREE.SphereGeometry(.150,24,16),hairMat,[.008,.132,.150]).scale.set(1.08,.42,.60);
  mk(headG,new THREE.SphereGeometry(.140,16,16),hairMat,[0,-.080,-.068]).scale.set(.88,.82,.72);
})();
function applyColor(role,hex){var c=new THREE.Color(hex);if(role==='hair'){mats.hair.forEach(function(m){m.color.set(c);});}else if(mats[role]){mats[role].color.set(c);}}
function onMsg(e){try{var d=JSON.parse(typeof e.data==='string'?e.data:JSON.stringify(e.data));if(d.type==='setColor')applyColor(d.role,d.hex);}catch(err){}}
document.addEventListener('message',onMsg);window.addEventListener('message',onMsg);
var theta=-.30,phi=1.50,radius=3.6,touching=false,lastX=0,lastY=0,pinchD=0,autoRot=true;
function updateCam(){camera.position.set(radius*Math.sin(phi)*Math.sin(theta),radius*Math.cos(phi)+.20,radius*Math.sin(phi)*Math.cos(theta));camera.lookAt(0,.15,0);}
updateCam();
document.addEventListener('touchstart',function(e){autoRot=false;if(e.touches.length===1){touching=true;lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;}if(e.touches.length===2)pinchD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);},{passive:true});
document.addEventListener('touchmove',function(e){e.preventDefault();if(e.touches.length===1&&touching){theta-=(e.touches[0].clientX-lastX)*.013;phi=Math.max(.35,Math.min(2.55,phi+(e.touches[0].clientY-lastY)*.009));lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;}if(e.touches.length===2){var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);radius=Math.max(1.5,Math.min(6,radius-(d-pinchD)*.008));pinchD=d;}updateCam();},{passive:false});
document.addEventListener('touchend',function(){touching=false;},{passive:true});
var t0=Date.now();
function loop(){requestAnimationFrame(loop);var t=(Date.now()-t0)*.001;var b=Math.sin(t*1.15)*.011;if(refs.torso){refs.torso.scale.set(1+b*.35,1+b,1+b*.35);refs.torso.position.y=.090+b*.30;}if(refs.neck)refs.neck.position.y=.418+b*.30;if(refs.headGroup){refs.headGroup.position.y=.648+b*.30+Math.sin(t*1.15)*.005;refs.headGroup.rotation.z=Math.sin(t*.55)*.013;}if(autoRot){theta+=.004;updateCam();}renderer.render(scene,camera);}
loop();
window.addEventListener('resize',function(){var w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});
var ov=document.getElementById('overlay');ov.classList.add('gone');setTimeout(function(){ov.style.display='none';},500);
if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
})();
</script>
</body>
</html>`;

interface Props {
  wardrobe?: WardrobeItem[];
  initialLayers?: WardrobeItem[];
  onClose?: () => void;
}

export default function Avatar3DCustomizer({ wardrobe = [], initialLayers = [], onClose }: Props) {
  const webRef  = useRef<any>(null);
  const [ready,       setReady]       = useState(false);
  const [failed,      setFailed]      = useState(false);
  const [activeTab,   setActiveTab]   = useState('tops');
  const [selectedIds, setSelectedIds] = useState<Record<string, string>>({});
  const [hairHex,     setHairHex]     = useState(DEFAULTS.hair);
  const [skinHex,     setSkinHex]     = useState(DEFAULTS.skin);

  const pendingRef = useRef<string[]>([]);

  const send = useCallback((role: string, hex: string) => {
    const msg = JSON.stringify({ type: 'setColor', role, hex });
    if (webRef.current) {
      webRef.current.postMessage(msg);
    } else {
      pendingRef.current.push(msg);
    }
  }, []);

  useEffect(() => {
    if (!ready || initialLayers.length === 0) return;
    const ids: Record<string, string> = {};
    initialLayers.forEach(item => {
      ids[item.layer] = item.id;
      const role = layerToRole(item.layer);
      if (role) send(role, toHex(item.color));
    });
    setSelectedIds(ids);
  }, [ready]);

  useEffect(() => {
    if (ready && pendingRef.current.length > 0) {
      pendingRef.current.forEach(m => webRef.current?.postMessage(m));
      pendingRef.current = [];
    }
  }, [ready]);

  function selectItem(item: WardrobeItem) {
    const role = layerToRole(item.layer);
    if (!role) return;
    const hex = toHex(item.color);
    setSelectedIds(prev => ({ ...prev, [item.layer]: item.id }));
    send(role, hex);
  }

  function pickHair(hex: string) { setHairHex(hex); send('hair', hex); }
  function pickSkin(hex: string) { setSkinHex(hex); send('skin', hex); }

  const tabItems = (() => {
    if (activeTab === 'tops')    return wardrobe.filter(i => ['Base Layer','Mid Layer','Outerwear'].includes(i.layer));
    if (activeTab === 'bottoms') return wardrobe.filter(i => i.layer === 'Bottom');
    if (activeTab === 'shoes')   return wardrobe.filter(i => i.layer === 'Footwear');
    return [];
  })();

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
        {!ready && !failed && (
          <View style={S.loadBox}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={S.loadTx}>Three.js ачаалж байна...</Text>
          </View>
        )}
        {failed ? (
          <View style={S.loadBox}>
            <Text style={S.errEmoji}>⚠️</Text>
            <Text style={S.errTx}>Three.js CDN ачаалагдсангүй.{'\n'}Интернэт холболтоо шалгана уу.</Text>
            <TouchableOpacity style={S.retryBtn} onPress={() => { setFailed(false); setReady(false); }}>
              <Text style={S.retryTx}>↺  Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webRef}
            source={{ html: VIEWER_HTML, baseUrl: 'https://cdn.jsdelivr.net' }}
            style={S.web}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            androidLayerType="hardware"
            scrollEnabled={false}
            allowsInlineMediaPlayback
            onMessage={(e: any) => {
              try {
                const msg = JSON.parse(e.nativeEvent.data);
                if (msg.type === 'ready') setReady(true);
              } catch {}
            }}
            onError={() => { setFailed(true); setReady(false); }}
          />
        )}
      </View>

      <View style={S.panel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabs}>
          {TABS.map(t => {
            const on = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[S.tab, on && S.tabOn]}
                onPress={() => setActiveTab(t.key)}
              >
                <Text style={S.tabEmoji}>{t.emoji}</Text>
                <Text style={[S.tabTx, on && S.tabTxOn]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={S.content}>
          {['tops','bottoms','shoes'].includes(activeTab) && (
            tabItems.length === 0 ? (
              <View style={S.empty}>
                <Text style={S.emptyTx}>
                  Wardrobe хоосон байна.{'\n'}Хувцас сангаас нэмнэ үү.
                </Text>
              </View>
            ) : (
              <FlatList
                data={tabItems}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={i => i.id}
                contentContainerStyle={S.itemList}
                renderItem={({ item }) => {
                  const isOn = selectedIds[item.layer] === item.id;
                  const hex  = toHex(item.color);
                  return (
                    <TouchableOpacity
                      style={[S.itemCard, isOn && S.itemCardOn]}
                      onPress={() => selectItem(item)}
                      activeOpacity={0.75}
                    >
                      <View style={[S.colorDot, { backgroundColor: hex }]} />
                      <Text style={S.itemEmoji}>{ITEM_EMOJI[item.type] ?? '🧺'}</Text>
                      <Text style={[S.itemType, isOn && S.itemTypeOn]} numberOfLines={1}>
                        {item.type}
                      </Text>
                      <Text style={S.itemColor} numberOfLines={1}>{item.color}</Text>
                      {isOn && <Text style={S.checkMark}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            )
          )}

          {activeTab === 'hair' && (
            <View style={S.swatchRow}>
              {HAIR_COLORS.map(hex => (
                <TouchableOpacity
                  key={hex}
                  style={[S.swatch, { backgroundColor: hex }, hairHex === hex && S.swatchOn]}
                  onPress={() => pickHair(hex)}
                />
              ))}
            </View>
          )}

          {activeTab === 'skin' && (
            <View style={S.swatchRow}>
              {SKIN_COLORS.map(hex => (
                <TouchableOpacity
                  key={hex}
                  style={[S.swatch, { backgroundColor: hex }, skinHex === hex && S.swatchOn]}
                  onPress={() => pickSkin(hex)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#16162a',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  title:   { fontSize: 15, fontWeight: '800', color: '#e8e8f0' },
  closeBtn:{ backgroundColor: 'rgba(124,106,245,0.15)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(124,106,245,0.3)' },
  closeTx: { fontSize: 12, fontWeight: '700', color: ACCENT },

  webWrap: { flex: 1, position: 'relative' },
  web:     { flex: 1, backgroundColor: BG },
  loadBox: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: BG },
  loadTx:  { fontSize: 14, color: ACCENT, fontWeight: '600', textAlign: 'center' },
  errEmoji:{ fontSize: 36 },
  errTx:   { fontSize: 13, color: '#fca5a5', textAlign: 'center', lineHeight: 20 },
  retryBtn:{ backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryTx: { fontSize: 13, fontWeight: '800', color: '#fff' },

  panel: {
    backgroundColor: '#0f0f1f',
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingBottom: 8,
  },

  tabs: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 99, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: CARD,
  },
  tabOn:   { backgroundColor: ACCENT, borderColor: ACCENT },
  tabEmoji:{ fontSize: 14 },
  tabTx:   { fontSize: 12, fontWeight: '700', color: '#6868a0' },
  tabTxOn: { color: '#fff' },

  content: { minHeight: 90 },

  itemList: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  itemCard: {
    width: 80, alignItems: 'center', gap: 3,
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER,
    paddingVertical: 8, paddingHorizontal: 4,
    position: 'relative',
  },
  itemCardOn:  { borderColor: ACCENT, backgroundColor: 'rgba(124,106,245,0.15)' },
  colorDot:    { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  itemEmoji:   { fontSize: 22 },
  itemType:    { fontSize: 10, fontWeight: '700', color: '#9090c0', textAlign: 'center' },
  itemTypeOn:  { color: ACCENT },
  itemColor:   { fontSize: 9, color: '#55557a', textAlign: 'center' },
  checkMark:   { position: 'absolute', top: 4, right: 6, fontSize: 10, color: ACCENT, fontWeight: '900' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyTx: { fontSize: 12, color: '#44445a', textAlign: 'center', lineHeight: 18 },

  swatchRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14,
    alignItems: 'center', flexWrap: 'wrap',
  },
  swatch:  { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  swatchOn:{ borderColor: ACCENT, transform: [{ scale: 1.2 }] },
});
