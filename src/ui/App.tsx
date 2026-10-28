import { BookPanel } from './panels/BookPanel';
import { DebugPanel } from './panels/DebugPanel';
import { ForgePanel } from './panels/forge/ForgePanel';
import { InventoryPanel } from './panels/InventoryPanel';
import { MarketPanel } from './panels/MarketPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { ShopPanel } from './panels/ShopPanel';
import { DialogueBox } from './components/DialogueBox';
import { Hud } from './components/Hud';
import { ItemCard } from './components/ItemCard';
import { LocationBar } from './components/LocationBar';
import { TitleScreen } from './components/TitleScreen';
import { Toasts } from './components/Toasts';
import { store, useSnapshot } from './hooks';

export function App() {
  const { ui, state } = useSnapshot();
  return (
    <>
      <div className="rotate-overlay">
        <div className="rotate-icon">📱↻</div>
        <p>Girá el dispositivo para jugar en horizontal.</p>
      </div>
      {ui.screen === 'loading' && <div className="splash">Avivando la fragua…</div>}
      {ui.screen === 'title' && <TitleScreen hasSave={ui.hasSave} />}
      {ui.screen === 'game' && state && (
        <>
          <Hud />
          {!ui.panel && !ui.dialogue && <LocationBar />}
          {ui.panel === 'forge' && <ForgePanel />}
          {ui.panel === 'shop' && <ShopPanel />}
          {ui.panel === 'market' && <MarketPanel />}
          {ui.panel === 'inventory' && <InventoryPanel />}
          {ui.panel === 'book' && <BookPanel />}
          {ui.panel === 'settings' && <SettingsPanel />}
          {ui.panel === 'debug' && ui.debug && <DebugPanel />}
          {ui.dialogue && <DialogueBox />}
          {ui.itemCard && (
            <ItemCard item={ui.itemCard.item} newSynergies={ui.itemCard.newSynergies} onClose={() => store.setUi({ itemCard: null })} />
          )}
        </>
      )}
      <Toasts toasts={ui.toasts} />
    </>
  );
}
