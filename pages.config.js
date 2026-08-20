import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import AIGeneration from './pages/AIGeneration';
import LyricsGenerator from './pages/LyricsGenerator';
import VoiceLab from './pages/VoiceLab';
import SampleLibrary from './pages/SampleLibrary';
import VirtualInstruments from './pages/VirtualInstruments';
import Mastering from './pages/Mastering';
import ProjectManager from './pages/ProjectManager';
import ExportCenter from './pages/ExportCenter';
import Settings from './pages/Settings';
import StudioLayout from './components/nexus/StudioLayout.jsx';

export const PAGES = {
    "studio": Studio,
    "ai-generation": AIGeneration,
    "lyrics": LyricsGenerator,
    "voice-lab": VoiceLab,
    "samples": SampleLibrary,
    "instruments": VirtualInstruments,
    "mastering": Mastering,
    "projects": ProjectManager,
    "export": ExportCenter,
    "settings": Settings,
}

export const pagesConfig = {
    mainPage: "dashboard",
    Pages: { ...PAGES, dashboard: Dashboard },
    Layout: StudioLayout,
};