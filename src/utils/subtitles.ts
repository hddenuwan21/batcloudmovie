import { SubtitleCue } from "../types";

export function parseSRT(text: string): SubtitleCue[] {
  const parts = text.split(/\r?\n\r?\n/);
  const cues: SubtitleCue[] = [];
  
  parts.forEach((part, index) => {
    const lines = part.trim().split(/\r?\n/);
    if (lines.length >= 2) {
      const id = lines[0].trim();
      let timeLine = lines[1].trim();
      let textStartIndex = 2;
      
      if (!timeLine.includes("-->") && lines.length >= 3) {
        timeLine = lines[2].trim();
        textStartIndex = 3;
      }
      
      if (timeLine && timeLine.includes("-->")) {
        const cueText = lines.slice(textStartIndex).join("<br>");
        const times = timeLine.split("-->");
        if (times.length === 2) {
          const startSec = timeToSeconds(times[0].trim().replace(",", "."));
          const endSec = timeToSeconds(times[1].trim().replace(",", "."));
          cues.push({ id: id || index, start: startSec, end: endSec, text: cueText });
        }
      }
    }
  });
  
  return cues;
}

export function parseVTT(text: string): SubtitleCue[] {
  const lines = text.split(/\r?\n/);
  const cues: SubtitleCue[] = [];
  let currentCue: Partial<SubtitleCue> | null = null;
  let state = "header";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentCue && currentCue.start !== undefined && currentCue.end !== undefined && currentCue.text !== undefined) {
        cues.push(currentCue as SubtitleCue);
        currentCue = null;
      }
      continue;
    }
    
    if (line.includes("-->")) {
      state = "cue";
      const parts = line.split("-->");
      const start = timeToSeconds(parts[0].trim());
      const end = timeToSeconds(parts[1].trim());
      currentCue = { id: cues.length + 1, start, end, text: "" };
    } else if (state === "cue" && currentCue) {
      if (currentCue.text) currentCue.text += "<br>";
      currentCue.text += line;
    }
  }
  
  if (currentCue && currentCue.start !== undefined && currentCue.end !== undefined && currentCue.text !== undefined) {
    cues.push(currentCue as SubtitleCue);
  }
  
  return cues;
}

export function timeToSeconds(t: string): number {
  const parts = t.split(":");
  let secs = 0;
  if (parts.length === 3) {
    secs += parseFloat(parts[0]) * 3600;
    secs += parseFloat(parts[1]) * 60;
    secs += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    secs += parseFloat(parts[0]) * 60;
    secs += parseFloat(parts[1]);
  }
  return secs;
}

export function formatCueTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
