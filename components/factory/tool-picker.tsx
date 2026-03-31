'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

const blockColors: Record<string, string> = {
  intake: '#1C1816',
  analysis: '#B8860B',
  documentation: '#A0522D',
  coordination: '#6B7F5E',
  exceptions: '#7B506F',
};

interface ToolOption {
  id: string;
  label: string;
}

const toolsByBlock: Record<string, ToolOption[]> = {
  intake: [
    { id: 'gmail', label: 'Gmail' },
    { id: 'outlook-email', label: 'Outlook' },
    { id: 'slack', label: 'Slack' },
    { id: 'teams', label: 'Teams' },
    { id: 'forms', label: 'Google Forms' },
    { id: 'sharepoint', label: 'SharePoint' },
  ],
  analysis: [
    { id: 'sheets', label: 'Google Sheets' },
    { id: 'excel', label: 'Excel' },
    { id: 'tableau', label: 'Tableau' },
    { id: 'power-bi', label: 'Power BI' },
    { id: 'airtable', label: 'Airtable' },
    { id: 'sql', label: 'SQL / Database' },
  ],
  documentation: [
    { id: 'google-docs', label: 'Google Docs' },
    { id: 'word', label: 'Word' },
    { id: 'notion', label: 'Notion' },
    { id: 'confluence', label: 'Confluence' },
    { id: 'pdf', label: 'PDF tools' },
    { id: 'canva', label: 'Canva' },
  ],
  coordination: [
    { id: 'google-calendar', label: 'Google Calendar' },
    { id: 'outlook-cal', label: 'Outlook Calendar' },
    { id: 'slack-coord', label: 'Slack' },
    { id: 'teams-coord', label: 'Teams' },
    { id: 'zoom', label: 'Zoom' },
    { id: 'asana', label: 'Asana' },
  ],
  exceptions: [
    { id: 'jira', label: 'Jira' },
    { id: 'asana-exc', label: 'Asana' },
    { id: 'trello', label: 'Trello' },
    { id: 'monday', label: 'Monday.com' },
    { id: 'salesforce', label: 'Salesforce' },
    { id: 'hubspot', label: 'HubSpot' },
  ],
};

export function ToolPicker({
  blockKey,
  blockLabel,
  selectedTools,
  onToggle,
}: {
  blockKey: string;
  blockLabel: string;
  selectedTools: string[];
  onToggle: (toolId: string) => void;
}) {
  const [showOther, setShowOther] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const color = blockColors[blockKey] || '#6B6259';
  const tools = toolsByBlock[blockKey] || toolsByBlock.intake;

  const handleAddOther = () => {
    if (otherValue.trim()) {
      onToggle(`custom:${otherValue.trim()}`);
      setOtherValue('');
      setShowOther(false);
    }
  };

  // Extract custom tools that were added via "Other"
  const customTools = selectedTools.filter(t => t.startsWith('custom:')).map(t => t.replace('custom:', ''));

  return (
    <div>
      <p className="text-[0.85rem] font-medium text-ink mb-3">
        For <span style={{ color }}>{blockLabel.split(' ')[0].toLowerCase()}</span> work, select the tools you use:
      </p>
      <div className="flex flex-wrap gap-2.5">
        {tools.map((tool) => {
          const isSelected = selectedTools.includes(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onToggle(tool.id)}
              className={`rounded-full border px-4 py-2.5 text-[0.85rem] font-medium transition-all duration-150 ${
                isSelected
                  ? 'border-ink bg-ink text-white'
                  : 'border-edge-strong bg-surface-raised text-ink-secondary hover:border-ink/30 hover:shadow-sm'
              }`}
            >
              {tool.label}
            </button>
          );
        })}

        {/* Custom tools that were added */}
        {customTools.map((ct) => (
          <button
            key={`custom:${ct}`}
            type="button"
            onClick={() => onToggle(`custom:${ct}`)}
            className="rounded-full border border-ink bg-ink px-4 py-2.5 text-[0.85rem] font-medium text-white transition-all duration-150"
          >
            {ct}
          </button>
        ))}

        {/* Other button / inline input */}
        {!showOther ? (
          <button
            type="button"
            onClick={() => setShowOther(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-edge-strong px-4 py-2.5 text-[0.85rem] text-ink-muted transition-all hover:border-ink/30 hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" />
            Other
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-surface-raised pl-4 pr-1.5 py-1">
            <input
              type="text"
              value={otherValue}
              onChange={(e) => setOtherValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOther()}
              placeholder="Tool name..."
              className="w-28 bg-transparent text-[0.85rem] text-ink outline-none placeholder:text-ink-tertiary/40"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddOther}
              disabled={!otherValue.trim()}
              className="rounded-full bg-ink px-3 py-1.5 text-[0.75rem] font-medium text-white disabled:opacity-30"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
