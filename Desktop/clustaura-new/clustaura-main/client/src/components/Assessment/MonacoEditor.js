import React from 'react';
import Editor from "@monaco-editor/react";

const MonacoEditor = ({ language = 'javascript', value, onChange }) => {
    return (
        <div className="monaco-wrapper">
            <Editor
                height="400px"
                defaultLanguage={language}
                defaultValue={value}
                theme="vs-dark"
                onChange={onChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                }}
            />
            <style jsx>{`
                .monaco-wrapper {
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    margin-top: 1rem;
                }
            `}</style>
        </div>
    );
};

export default MonacoEditor;
