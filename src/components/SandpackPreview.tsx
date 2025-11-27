'use client'

import { SandpackPreview as Preview, SandpackLayout, SandpackProvider } from '@codesandbox/sandpack-react'

interface SandpackPreviewProps {
    files: Record<string, string>
}

export function SandpackPreview({ files }: SandpackPreviewProps) {
    if (Object.keys(files).length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500">No files to preview</p>
            </div>
        )
    }

    // Convert Next.js App Router files to React format for Sandpack
    const sandpackFiles: Record<string, string> = {}

    Object.entries(files).forEach(([path, content]) => {
        let cleanPath = path.startsWith('/') ? path.substring(1) : path
        let processedContent = content

        // Skip layout and globals.css files
        if (cleanPath.includes('layout.tsx') || cleanPath.includes('globals.css')) {
            return
        }

        // Convert app/page.tsx to App.tsx
        if (cleanPath === 'app/page.tsx' || cleanPath === 'page.tsx') {
            cleanPath = 'App.tsx'
            // Remove Next.js specific imports and convert to React
            processedContent = content
                .replace(/import\s+.*from\s+['"]next\/.*['"]/g, '') // Remove Next.js imports
                .replace(/export\s+const\s+metadata\s*=\s*{[^}]*}/g, '') // Remove metadata
        }
        // Move app-level CSS to root to match App.tsx
        else if (cleanPath.startsWith('app/') && cleanPath.endsWith('.css')) {
            cleanPath = cleanPath.replace('app/', '')
        }

        // Convert component imports from ../components/ to ./components/
        processedContent = processedContent
            .replace(/from\s+(['"])(\.\.|@)\/components\//g, 'from $1./components/')
            // Fix @/components import (without trailing slash)
            .replace(/from\s+(['"])@\/components(['"])/g, 'from $1./components$1')

        // Standardize exports for components to ensure both Named and Default exports exist
        if (cleanPath.startsWith('components/')) {
            const componentName = cleanPath.replace('components/', '').replace(/\.tsx?$/, '');

            // Case 1: export default function Name() {} -> export function Name() {} ... export default Name;
            if (processedContent.match(/export\s+default\s+function\s+\w+/)) {
                processedContent = processedContent.replace(/export\s+default\s+function\s+(\w+)/, 'export function $1');
                processedContent += `\nexport default ${componentName};`;
            }
            // Case 2: export default function() {} -> export function ComponentName() {} ... export default ComponentName;
            else if (processedContent.match(/export\s+default\s+function\s*\(/)) {
                processedContent = processedContent.replace(/export\s+default\s+function\s*\(/, `export function ${componentName}(`);
                processedContent += `\nexport default ${componentName};`;
            }
            // Case 3: export function Name() {} (Named only) -> append export default Name;
            else if (!processedContent.includes('export default') && processedContent.includes(`export function ${componentName}`)) {
                processedContent += `\nexport default ${componentName};`;
            }
            // Case 4: const Name = ... export default Name; (Default only, variable)
            else if (processedContent.match(new RegExp(`export\\s+default\\s+${componentName}\\s*;?`))) {
                // Check if it's NOT already exported as named
                if (!processedContent.match(new RegExp(`export\\s+(const|function|class)\\s+${componentName}`))) {
                    // Replace "export default Name" with "export { Name }; export default Name;"
                    processedContent = processedContent.replace(
                        new RegExp(`export\\s+default\\s+${componentName}\\s*;?`),
                        `export { ${componentName} };\nexport default ${componentName};`
                    );
                }
            }
        }

        // Robust Lucide Icon Handling: Proxy imports to fallback to HelpCircle if icon is missing
        if (processedContent.includes('lucide-react')) {
            processedContent = processedContent.replace(
                /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g,
                'import * as Lucide from "lucide-react";\nconst {$1} = new Proxy(Lucide, { get: (t, p) => t[p] || t.HelpCircle || (() => null) });'
            );
        }

        // Fix broken placeholder images (e.g. src="150?text=...")
        processedContent = processedContent.replace(/src=['"](\d+)\?text=([^'"]+)['"]/g, 'src="https://via.placeholder.com/$1?text=$2"');

        // We NO LONGER mock or remove CSS imports. We want them to work!

        sandpackFiles[cleanPath] = processedContent
    })

    // Generate components/index.ts if missing to support barrel imports
    if (!sandpackFiles['components/index.ts'] && !sandpackFiles['components/index.tsx']) {
        const componentFiles = Object.keys(sandpackFiles).filter(f => f.startsWith('components/') && (f.endsWith('.tsx') || f.endsWith('.ts')));
        if (componentFiles.length > 0) {
            const exports = componentFiles.map(f => {
                const name = f.replace('components/', '').replace(/\.tsx?$/, '');
                // Since we standardized exports, we can safely use export *
                return `export * from './${name}';`;
            }).join('\n');
            sandpackFiles['components/index.ts'] = exports;
        }
    }

    // Ensure we have an App.tsx
    if (!sandpackFiles['App.tsx']) {
        sandpackFiles['App.tsx'] = `export default function App() {
  return <div className="p-8 text-center">No content to preview</div>
}`
    }

    return (
        <div className="w-full h-full">
            <SandpackProvider
                template="react-ts"
                files={sandpackFiles}
                theme="dark"
                customSetup={{
                    dependencies: {
                        'react': '^18.2.0',
                        'react-dom': '^18.2.0',
                        'lucide-react': '^0.263.1',
                        'framer-motion': '^10.16.0',
                        'clsx': '^2.0.0',
                        'tailwind-merge': '^2.0.0'
                    }
                }}
                options={{
                    externalResources: [
                        'https://cdn.tailwindcss.com'
                    ]
                }}
                style={{ height: '100%', width: '100%' }}
            >
                <SandpackLayout style={{ height: '100%', width: '100%', border: 'none', borderRadius: 0 }}>
                    <Preview
                        style={{ height: '100%', width: '100%' }}
                        showOpenInCodeSandbox={false}
                        showRefreshButton={true}
                    />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    )
}
