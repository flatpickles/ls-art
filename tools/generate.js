import { generateTemplateFiles } from 'generate-template-files';

generateTemplateFiles([
    {
        option: 'Plotter Project',
        defaultCase: '(pascalCase)',
        entry: {
            folderPath: './tools/templates/plotter/',
        },
        stringReplacers: [
            { question: 'Title:', slot: '__title__' }
        ],
        output: {
            path: './src/art/__title__/',
            pathAndFileNameDefaultCase: '(pascalCase)',
        },
    },
    {
        option: 'Shader Project',
        defaultCase: '(pascalCase)',
        entry: {
            folderPath: './tools/templates/shader/',
        },
        stringReplacers: [
            { question: 'Title:', slot: '__title__' }
        ],
        output: {
            path: './src/art/__title__/',
            pathAndFileNameDefaultCase: '(pascalCase)',
        },
    }
]);