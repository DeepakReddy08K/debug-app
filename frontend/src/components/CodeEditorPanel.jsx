import Editor from '@monaco-editor/react';
import { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const detectLanguage = (code) => {
  if (/#include|using namespace|int main|cout|cin/.test(code)) return 'cpp';
  if (/import java|public class|System\.out/.test(code)) return 'java';
  if (/console\.log|function |const |let |=>/.test(code)) return 'javascript';
  if (/^def |^import |print\(|input\(/.test(code)) return 'python';
  return 'cpp'; // default
};

const CodeEditorPanel = ({ label, value, onChange }) => {
  const editorRef = useRef(null);
  const { theme } = useTheme();

  const language = detectLanguage(value);

  const handleEditorMount = (ed) => {
    editorRef.current = ed;
    ed.onDidFocusEditorText(() => {
      ed.updateOptions({ renderLineHighlight: 'all' });
    });
    ed.onDidBlurEditorText(() => {
      ed.updateOptions({ renderLineHighlight: 'none' });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Editor label */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.8px', textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}>
          {label}
        </span>
        {value && (
          <span style={{
            fontSize: '10px', color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}>
            {language}
          </span>
        )}
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(val) => onChange(val || '')}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            cursorStyle: 'line',
            cursorWidth: 2,
            readOnly: false,
            selectOnLineNumbers: true,
            roundedSelection: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true, highlightActiveIndentation: true },
            renderLineHighlight: 'none',
            renderLineHighlightOnlyWhenFocus: true,
            multiCursorModifier: 'ctrlCmd',
            occurrencesHighlight: 'singleFile',
            selectionHighlight: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'advanced',
            autoSurround: 'languageDefined',
            formatOnPaste: false,
            formatOnType: false,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            suggest: {
              showWords: true,
              showSnippets: true,
              preview: true,
              shareSuggestSelections: true,
              showMethods: true,
              showFunctions: true,
              showVariables: true,
              showClasses: true,
              showKeywords: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showIssues: true,
              showUsers: true,
              showStructs: true,
              filterGraceful: true,
              localityBonus: true,
            },
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            suggestOnTriggerCharacters: true,
            suggestSelection: 'recentlyUsed',
            parameterHints: { enabled: true, cycle: true },
            folding: true,
            foldingHighlight: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'mouseover',
            matchBrackets: 'always',
            mouseWheelZoom: true,
            dragAndDrop: true,
            copyWithSyntaxHighlighting: false,
            glyphMargin: false,
            lineDecorationsWidth: 8,
            lineNumbersMinChars: 3,
            links: true,
            contextmenu: true,
            columnSelection: false,
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: 'multiline',
              seedSearchStringFromSelection: 'always',
            },
            snippetSuggestions: 'inline',
            tabCompletion: 'on',
            wordBasedSuggestions: 'currentDocument',
            renderWhitespace: 'none',
            stickyScroll: { enabled: false },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditorPanel;