import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, afterEach } from 'vitest';
import ParamList from '$lib/components/ProjectDetailPanel/ParamList.svelte';
import Project from '$lib/base/Project/Project';
import type { ProjectTuple } from '$lib/base/ProjectLoading/ProjectLoader';
import { ParamType } from '$lib/base/ConfigModels/ParamConfig';
import { ProjectConfigFactory } from '$lib/base/ProjectLoading/ProjectConfigFactory';

import type { UserFileLoaderReturnType } from '$lib/base/ConfigModels/ParamTypes';
import FileParamLoader from '$lib/base/Util/FileParamLoader';

import ParamValueProvider from '$lib/base/ProjectLoading/ParamValueProvider';
import { defaultPresetKey } from '$lib/base/ProjectLoading/PresetLoader';
vi.spyOn(ParamValueProvider, 'getValue');
vi.spyOn(ParamValueProvider, 'setValue');

class TestProject extends Project {
    testNumber = 42;
    testBoolean = true;
    testString = 'hello';
    testNumericArray = [1, 2, 3];
    testFunction = () => 42;
    testFile = () => {
        return;
    };
}

const testPresets = {
    [defaultPresetKey]: {
        title: 'Default Values',
        key: defaultPresetKey,
        values: {
            testNumber: 42,
            testBoolean: true,
            testString: 'hello',
            testNumericArray: [1, 2, 3]
        }
    },
    'preset1': {
        title: 'Preset 1',
        key: 'preset1',
        values: {
            testNumber: 43,
            testBoolean: false,
            testString: 'goodbye',
            testNumericArray: [4, 5, 6]
        }
    },
    'preset2': {
        title: 'Preset 2',
        key: 'preset2',
        values: {
            testNumber: 44,
            testBoolean: true,
            testString: 'hello again',
            testNumericArray: [7, 8, 9]
        }
    },
    'preset3': {
        title: 'Preset 3',
        key: 'preset3',
        values: {
            testNumber: 45,
            testBoolean: true
        }
    }
};

enum SectionOption {
    NoSections = 'none', // no params in sections
    SomeSections = 'someSectioned', // some params in sections
    AllSections = 'allSectioned' // all params in sections
}

function paramsWithApplyDuringInput(
    applyDuringInput = true,
    sectionOption: SectionOption = SectionOption.NoSections
) {
    return [
        {
            type: ParamType.Number,
            key: 'testNumber',
            name: 'Test Number',
            applyDuringInput: applyDuringInput,
            fullWidthInput: false,
            style: 'combo',
            section: sectionOption === SectionOption.AllSections ? 'Section 1' : undefined
        },
        {
            type: ParamType.Boolean,
            key: 'testBoolean',
            name: 'Test Boolean',
            applyDuringInput: applyDuringInput,
            fullWidthInput: false,
            section: [SectionOption.SomeSections, SectionOption.AllSections].includes(sectionOption)
                ? 'Section 1'
                : undefined
        },
        {
            type: ParamType.String,
            key: 'testString',
            name: 'Test String',
            applyDuringInput: applyDuringInput,
            fullWidthInput: false,
            style: 'single',
            section: [SectionOption.SomeSections, SectionOption.AllSections].includes(sectionOption)
                ? 'Section 1'
                : undefined
        },
        {
            type: ParamType.NumericArray,
            key: 'testNumericArray',
            name: 'Test Numeric Array',
            applyDuringInput: applyDuringInput,
            fullWidthInput: false,
            style: 'slider',
            section: [SectionOption.SomeSections, SectionOption.AllSections].includes(sectionOption)
                ? 'Section 2'
                : undefined
        },
        {
            type: ParamType.Function,
            key: 'testFunction',
            name: 'Test Function',
            applyDuringInput: applyDuringInput,
            fullWidthInput: false,
            section: [SectionOption.SomeSections, SectionOption.AllSections].includes(sectionOption)
                ? 'Section 2'
                : undefined
        },
        {
            type: ParamType.File,
            key: 'testFile',
            name: 'Test File',
            applyDuringInput: applyDuringInput,
            fullWidthInput: false,
            section: [SectionOption.SomeSections, SectionOption.AllSections].includes(sectionOption)
                ? 'Section 2'
                : undefined
        }
    ];
}

function renderParams(
    applyDuringInput = true,
    sectionOption: SectionOption = SectionOption.NoSections,
    twoWaySync = true,
    selectedPresetKey = defaultPresetKey
): [TestProject, ReturnType<typeof vi.fn>, ParamList] {
    const project = new TestProject();
    const testProjectConfig = ProjectConfigFactory.projectConfigFrom({
        applyDuringInput: applyDuringInput,
        twoWaySync: twoWaySync
    });
    const testTuple: ProjectTuple = {
        key: 'testProject',
        project: project,
        config: testProjectConfig,
        params: paramsWithApplyDuringInput(applyDuringInput, sectionOption),
        presets: testPresets
    };
    const { component } = render(ParamList, {
        projectTuple: testTuple,
        selectedPresetKey: selectedPresetKey
    });

    const changedListener = vi.fn();
    document.addEventListener('params-changed', changedListener);

    expect(ParamValueProvider.getValue).toHaveBeenCalledTimes(0);
    expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(0);
    return [project, changedListener, component];
}

function cleanupParams() {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
}

describe('ParamList list', () => {
    afterEach(cleanupParams);

    it('renders param items as even/odd correctly (no sections)', async () => {
        renderParams(true, SectionOption.NoSections);

        // Check label wrappers
        const labelWrappers = screen.getAllByTestId('param-label-wrapper');
        expect(labelWrappers.length).toBe(6);
        expect(labelWrappers[0].classList.contains('odd')).toBe(true);
        expect(labelWrappers[1].classList.contains('even')).toBe(true);
        expect(labelWrappers[2].classList.contains('odd')).toBe(true);
        expect(labelWrappers[3].classList.contains('even')).toBe(true);
        expect(labelWrappers[4].classList.contains('odd')).toBe(true);
        expect(labelWrappers[5].classList.contains('even')).toBe(true);

        // Check input wrappers
        const inputWrappers = screen.getAllByTestId('param-input-wrapper');
        expect(inputWrappers.length).toBe(6);
        expect(inputWrappers[0].classList.contains('odd')).toBe(true);
        expect(inputWrappers[1].classList.contains('even')).toBe(true);
        expect(inputWrappers[2].classList.contains('odd')).toBe(true);
        expect(inputWrappers[3].classList.contains('even')).toBe(true);
        expect(inputWrappers[4].classList.contains('odd')).toBe(true);
        expect(inputWrappers[5].classList.contains('even')).toBe(true);
    });

    it('renders param items as even/odd correctly (some in sections)', async () => {
        renderParams(true, SectionOption.SomeSections);

        // Check label wrappers
        const labelWrappers = screen.getAllByTestId('param-label-wrapper');
        expect(labelWrappers.length).toBe(6);
        expect(labelWrappers[0].classList.contains('odd')).toBe(true);
        expect(labelWrappers[1].classList.contains('odd')).toBe(true);
        expect(labelWrappers[2].classList.contains('even')).toBe(true);
        expect(labelWrappers[3].classList.contains('odd')).toBe(true);
        expect(labelWrappers[4].classList.contains('even')).toBe(true);
        expect(labelWrappers[5].classList.contains('odd')).toBe(true);

        // Check input wrappers
        const inputWrappers = screen.getAllByTestId('param-input-wrapper');
        expect(inputWrappers.length).toBe(6);
        expect(inputWrappers[0].classList.contains('odd')).toBe(true);
        expect(inputWrappers[1].classList.contains('odd')).toBe(true);
        expect(inputWrappers[2].classList.contains('even')).toBe(true);
        expect(inputWrappers[3].classList.contains('odd')).toBe(true);
        expect(inputWrappers[4].classList.contains('even')).toBe(true);
        expect(inputWrappers[5].classList.contains('odd')).toBe(true);
    });

    it('renders param items as even/odd correctly (all in sections)', async () => {
        renderParams(true, SectionOption.AllSections);

        // Check label wrappers
        const labelWrappers = screen.getAllByTestId('param-label-wrapper');
        expect(labelWrappers.length).toBe(6);
        expect(labelWrappers[0].classList.contains('odd')).toBe(true);
        expect(labelWrappers[1].classList.contains('even')).toBe(true);
        expect(labelWrappers[2].classList.contains('odd')).toBe(true);
        expect(labelWrappers[3].classList.contains('odd')).toBe(true);
        expect(labelWrappers[4].classList.contains('even')).toBe(true);
        expect(labelWrappers[5].classList.contains('odd')).toBe(true);

        // Check input wrappers
        const inputWrappers = screen.getAllByTestId('param-input-wrapper');
        expect(inputWrappers.length).toBe(6);
        expect(inputWrappers[0].classList.contains('odd')).toBe(true);
        expect(inputWrappers[1].classList.contains('even')).toBe(true);
        expect(inputWrappers[2].classList.contains('odd')).toBe(true);
        expect(inputWrappers[3].classList.contains('odd')).toBe(true);
        expect(inputWrappers[4].classList.contains('even')).toBe(true);
        expect(inputWrappers[5].classList.contains('odd')).toBe(true);
    });

    it('renders param label names properly, in order', async () => {
        renderParams();
        const labelItems = screen.getAllByTestId('param-label');
        expect(labelItems.length).toBe(6);
        expect(labelItems[0].textContent).toContain('Test Number');
        expect(labelItems[1].textContent).toContain('Test Boolean');
        expect(labelItems[2].textContent).toContain('Test String');
        expect(labelItems[3].textContent).toContain('Test Numeric Array');
        expect(labelItems[4].textContent).toContain('Test Function');
        expect(labelItems[5].textContent).toContain('Test File');
    });

    it('renders param default values properly', async () => {
        renderParams();
        const booleanInput = screen.getByTestId('boolean-param-input') as HTMLInputElement;
        expect(booleanInput).toBeDefined();
        expect(booleanInput.checked).toBe(true);
        const stringInput = screen.getByTestId('string-param-input-singleline') as HTMLInputElement;
        expect(stringInput).toBeDefined();
        expect(stringInput.value).toBe('hello');
        const functionInput = screen.getByTestId('function-param-input') as HTMLInputElement;
        expect(functionInput).toBeDefined();
        const fileInput = screen.getByTestId('file-param-input') as HTMLInputElement;
        expect(fileInput).toBeDefined();

        // Both single & array numeric inputs are rendered
        const numberInputSliders = screen.getAllByTestId(
            'number-param-slider'
        ) as HTMLInputElement[];
        expect(numberInputSliders.length).toBe(4);
        expect(numberInputSliders[0].value).toBe('42');
        expect(numberInputSliders[1].value).toBe('1');
        expect(numberInputSliders[2].value).toBe('2');
        expect(numberInputSliders[3].value).toBe('3');
    });

    it('updates displayed values when changing projects', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [project, changedListener, component] = renderParams(true);
        expect(component.presetEdited).toBe(false);

        // Create a new project and set values that don't correspond with the defaults
        const project2 = new TestProject();
        project2.testNumber = 43;
        project2.testBoolean = false;
        project2.testString = 'goodbye';
        project2.testNumericArray = [4, 5, 6];
        const testProjectConfig = ProjectConfigFactory.projectConfigFrom({
            applyDuringInput: true,
            twoWaySync: true
        });
        const testTuple: ProjectTuple = {
            key: 'testProject2',
            project: project2,
            config: testProjectConfig,
            params: paramsWithApplyDuringInput(true),
            presets: testPresets
        };

        // After setting the projectTuple, displayed values should be updated
        component.projectTuple = testTuple;
        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        expect(numberInput.value).toBe('43');
        const booleanInput = screen.getByTestId('boolean-param-input') as HTMLInputElement;
        expect(booleanInput.checked).toBe(false);
        const stringInput = screen.getByTestId('string-param-input-singleline') as HTMLInputElement;
        expect(stringInput.value).toBe('goodbye');
        const numericArrayInput = screen.getAllByTestId(
            'number-param-slider'
        ) as HTMLInputElement[];
        numericArrayInput.shift(); // first is the non-array numeric input
        expect(numericArrayInput.length).toBe(3);
        expect(numericArrayInput[0].value).toBe('4');
        expect(numericArrayInput[1].value).toBe('5');
        expect(numericArrayInput[2].value).toBe('6');
    });
});

describe('ParamList sections', () => {
    afterEach(cleanupParams);

    it('renders param sections properly (some params in sections)', async () => {
        renderParams(true, SectionOption.SomeSections);
        const noSectionParams = screen.getByTestId('no-section-params');
        const sectionItems = screen.getAllByTestId('params-section');

        // Check no section params
        expect(noSectionParams).toBeDefined();
        expect(noSectionParams.textContent).toContain('Test Number');
        expect(noSectionParams.nextElementSibling).toBe(sectionItems[0]);

        // Check sections
        expect(sectionItems.length).toBe(2);
        expect(sectionItems[0].textContent).toContain('Section 1');
        expect(sectionItems[1].textContent).toContain('Section 2');
        expect(sectionItems[0].nextElementSibling).toBe(sectionItems[1]);
        expect(sectionItems[1].nextElementSibling).toBeNull();
        expect(sectionItems[0].textContent).toContain('Test Boolean');
        expect(sectionItems[0].textContent).toContain('Test String');
        expect(sectionItems[1].textContent).toContain('Test Numeric Array');
        expect(sectionItems[1].textContent).toContain('Test Function');
    });

    it('renders param sections properly (all params in sections)', async () => {
        renderParams(true, SectionOption.AllSections);
        const sectionItems = screen.getAllByTestId('params-section');
        expect(() => {
            screen.getByTestId('no-section-params');
        }).toThrow();

        // Check sections
        expect(sectionItems.length).toBe(2);
        expect(sectionItems[0].textContent).toContain('Section 1');
        expect(sectionItems[1].textContent).toContain('Section 2');
        expect(sectionItems[0].nextElementSibling).toBe(sectionItems[1]);
        expect(sectionItems[1].nextElementSibling).toBeNull();
        expect(sectionItems[0].textContent).toContain('Test Number');
        expect(sectionItems[0].textContent).toContain('Test Boolean');
        expect(sectionItems[0].textContent).toContain('Test String');
        expect(sectionItems[1].textContent).toContain('Test Numeric Array');
        expect(sectionItems[1].textContent).toContain('Test Function');
    });

    it('renders param sections properly (no params in sections)', async () => {
        renderParams(true, SectionOption.NoSections);
        const noSectionParams = screen.getByTestId('no-section-params');
        expect(() => {
            screen.getAllByTestId('params-section');
        }).toThrow();

        // Check no section params
        expect(noSectionParams).toBeDefined();
        expect(noSectionParams.textContent).toContain('Test Number');
        expect(noSectionParams.nextElementSibling).toBeNull();
    });
});

describe('number param input', () => {
    afterEach(cleanupParams);

    it('updates a number param when the input changes (applyDuringInput)', async () => {
        const [project, changedListener] = renderParams(true);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        expect(numberInput.value).toBe('42');
        expect(project.testNumber).toBe(42);
        fireEvent.input(numberInput, { target: { value: '43' } });
        expect(changedListener).toHaveBeenCalledTimes(1);
        expect(numberInput.value).toBe('43');
        expect(project.testNumber).toBe(43);
        fireEvent.change(numberInput, { target: { value: '44' } });
        expect(changedListener).toHaveBeenCalledTimes(2);
        expect(numberInput.value).toBe('44');
        expect(project.testNumber).toBe(44);
        expect(changedListener).toHaveBeenCalledTimes(2);

        // Validate params-changed event
        expect(changedListener.mock.calls[0][0].bubbles).toEqual(true);
        expect(changedListener.mock.calls[0][0].detail).toEqual(
            expect.arrayContaining(['testNumber'])
        );
    });

    it('updates a number param when the input changes (!applyDuringInput)', async () => {
        const [project, changedListener] = renderParams(false);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        expect(numberInput.value).toBe('42');
        expect(project.testNumber).toBe(42);
        fireEvent.input(numberInput, { target: { value: '43' } });
        expect(changedListener).toHaveBeenCalledTimes(0);
        expect(numberInput.value).toBe('43');
        await new Promise((r) => setTimeout(r, 100)); // Make sure displaySyncLoop has time to run
        expect(numberInput.value).toBe('43');
        expect(project.testNumber).toBe(42);
        fireEvent.change(numberInput, { target: { value: '44' } });
        expect(changedListener).toHaveBeenCalledTimes(1);
        expect(numberInput.value).toBe('44');
        expect(project.testNumber).toBe(44);
        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(1);

        // Validate params-changed event
        expect(changedListener.mock.calls[0][0].bubbles).toEqual(true);
        expect(changedListener.mock.calls[0][0].detail).toEqual(
            expect.arrayContaining(['testNumber'])
        );
    });

    it("doesn't call paramsChanged when input changes to the same value", async () => {
        const [project, changedListener] = renderParams(true);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        expect(numberInput.value).toBe('42');
        expect(project.testNumber).toBe(42);
        fireEvent.input(numberInput, { target: { value: '42' } });
        expect(changedListener).toHaveBeenCalledTimes(0);
        expect(numberInput.value).toBe('42');
        expect(project.testNumber).toBe(42);
        fireEvent.change(numberInput, { target: { value: '42' } });
        expect(changedListener).toHaveBeenCalledTimes(0);
        expect(numberInput.value).toBe('42');
        expect(project.testNumber).toBe(42);
        expect(changedListener).toHaveBeenCalledTimes(0);
    });
});

describe('boolean param input', () => {
    afterEach(cleanupParams);

    it('updates a boolean param when the input changes', async () => {
        const [project, changedListener] = renderParams(true);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        const booleanInput = screen.getByTestId('boolean-param-input') as HTMLInputElement;
        expect(booleanInput.checked).toBe(true);
        expect(project.testBoolean).toBe(true);
        fireEvent.click(booleanInput);
        expect(changedListener).toHaveBeenCalledTimes(1);
        expect(booleanInput.checked).toBe(false);
        expect(project.testBoolean).toBe(false);
        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(1);

        // Validate params-changed event
        expect(changedListener.mock.calls[0][0].bubbles).toEqual(true);
        expect(changedListener.mock.calls[0][0].detail).toEqual(
            expect.arrayContaining(['testBoolean'])
        );
    });
});

describe('string param input', () => {
    afterEach(cleanupParams);

    it('updates a string param when the input changes (applyDuringInput)', async () => {
        const [project, changedListener] = renderParams(true);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        const stringInput = screen.getByTestId('string-param-input-singleline') as HTMLInputElement;
        expect(stringInput.value).toBe('hello');
        expect(project.testString).toBe('hello');
        fireEvent.input(stringInput, { target: { value: 'goodbye' } });
        expect(changedListener).toHaveBeenCalledTimes(1);
        expect(stringInput.value).toBe('goodbye');
        expect(project.testString).toBe('goodbye');
        fireEvent.change(stringInput);
        expect(changedListener).toHaveBeenCalledTimes(1);
        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(1);

        // Validate params-changed event
        expect(changedListener.mock.calls[0][0].bubbles).toEqual(true);
        expect(changedListener.mock.calls[0][0].detail).toEqual(
            expect.arrayContaining(['testString'])
        );
    });

    it('updates a string param when the input changes (!applyDuringInput)', async () => {
        const [project, changedListener] = renderParams(false);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        const stringInput = screen.getByTestId('string-param-input-singleline') as HTMLInputElement;
        expect(stringInput.value).toBe('hello');
        expect(project.testString).toBe('hello');
        fireEvent.input(stringInput, { target: { value: 'goodbye' } });
        expect(changedListener).toHaveBeenCalledTimes(0);
        expect(stringInput.value).toBe('goodbye');
        await new Promise((r) => setTimeout(r, 100)); // Make sure displaySyncLoop has time to run
        expect(stringInput.value).toBe('goodbye');
        expect(project.testString).toBe('hello');
        fireEvent.change(stringInput);
        expect(changedListener).toHaveBeenCalledTimes(1);
        expect(stringInput.value).toBe('goodbye');
        expect(project.testString).toBe('goodbye');
        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(1);

        // Validate params-changed event
        expect(changedListener.mock.calls[0][0].bubbles).toEqual(true);
        expect(changedListener.mock.calls[0][0].detail).toEqual(
            expect.arrayContaining(['testString'])
        );
    });
});

describe('numeric array param input', () => {
    afterEach(cleanupParams);

    it('updates a numeric array param when the input changes (applyDuringInput)', async () => {
        const [project, changedListener] = renderParams(true);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        const numericArrayInput = screen.getAllByTestId(
            'number-param-slider'
        ) as HTMLInputElement[];
        numericArrayInput.shift(); // first is the non-array numeric input
        expect(numericArrayInput.length).toBe(3);
        expect(numericArrayInput[0].value).toBe('1');
        expect(numericArrayInput[1].value).toBe('2');
        expect(numericArrayInput[2].value).toBe('3');
        expect(project.testNumericArray).toEqual([1, 2, 3]);
        fireEvent.input(numericArrayInput[0], { target: { value: '4' } });
        expect(changedListener).toHaveBeenCalledTimes(1);
        expect(numericArrayInput[0].value).toBe('4');
        expect(project.testNumericArray).toEqual([4, 2, 3]);
        fireEvent.change(numericArrayInput[1], { target: { value: '5' } });
        expect(changedListener).toHaveBeenCalledTimes(2);
        expect(numericArrayInput[1].value).toBe('5');
        expect(project.testNumericArray).toEqual([4, 5, 3]);
        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(1);

        // Validate params-changed event
        expect(changedListener.mock.calls[0][0].bubbles).toEqual(true);
        expect(changedListener.mock.calls[0][0].detail).toEqual(
            expect.arrayContaining(['testNumericArray'])
        );
    });

    it('updates a numeric array param when the input changes (!applyDuringInput)', async () => {
        const [project, changedListener] = renderParams(false);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        const numericArrayInput = screen.getAllByTestId(
            'number-param-slider'
        ) as HTMLInputElement[];
        numericArrayInput.shift(); // first is the non-array numeric input
        expect(numericArrayInput.length).toBe(3);
        expect(numericArrayInput[0].value).toBe('1');
        expect(numericArrayInput[1].value).toBe('2');
        expect(numericArrayInput[2].value).toBe('3');
        expect(project.testNumericArray).toEqual([1, 2, 3]);
        fireEvent.input(numericArrayInput[0], { target: { value: '4' } });
        expect(changedListener).toHaveBeenCalledTimes(0);
        expect(numericArrayInput[0].value).toBe('4');
        await new Promise((r) => setTimeout(r, 100)); // Make sure displaySyncLoop has time to run
        expect(numericArrayInput[0].value).toBe('4');
        expect(project.testNumericArray).toEqual([1, 2, 3]);
        fireEvent.change(numericArrayInput[1], { target: { value: '5' } });
        expect(changedListener).toHaveBeenCalledTimes(1);
        expect(numericArrayInput[1].value).toBe('5');
        expect(project.testNumericArray).toEqual([4, 5, 3]);
        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(1);

        // Validate params-changed event
        expect(changedListener.mock.calls[0][0].bubbles).toEqual(true);
        expect(changedListener.mock.calls[0][0].detail).toEqual(
            expect.arrayContaining(['testNumericArray'])
        );
    });
});

describe('function param input', () => {
    afterEach(cleanupParams);

    it('calls a param-ized function when the button is clicked', async () => {
        const [project, changedListener] = renderParams(true);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        vi.spyOn(project, 'testFunction');
        const functionButton = screen.getByTestId('function-param-input');
        expect(project.testFunction).toHaveBeenCalledTimes(0);
        fireEvent.click(functionButton);
        await waitFor(() => expect(project.testFunction).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(changedListener).toHaveBeenCalledTimes(0));
        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(0);
    });
});

describe('file param input', () => {
    afterEach(cleanupParams);

    // Mocking stuff!

    const mockFiles = [
        {
            name: 'testFile1',
            contents: 'testFile1 contents',
            fileObject: new File([''], 'testFile1')
        },
        {
            name: 'testFile2',
            contents: 'testFile2 contents',
            fileObject: new File([''], 'testFile2')
        }
    ];
    const mockFileContents = mockFiles.map((file) => file.contents);

    vi.spyOn(FileParamLoader, 'loadFileList').mockImplementation(
        (fileList: FileList): Promise<UserFileLoaderReturnType> => {
            const fileArray: File[] = [];
            for (let i = 0; i < fileList.length; i++) {
                const item = fileList.item(i);
                if (item) fileArray.push(item);
            }
            return Promise.resolve({
                result: mockFileContents,
                metadata: fileArray
            });
        }
    );

    const fileListMock = {
        length: mockFiles.length,
        item: (idx: number) => mockFiles[idx].fileObject
    };

    // Actual tests...

    it('attempts to load files when the input changes', async () => {
        const [project, changedListener] = renderParams(true);
        vi.spyOn(project, 'update');
        vi.spyOn(project, 'paramsChanged');
        vi.spyOn(project, 'testFile');
        const fileInput = screen.getByTestId('native-file-input') as HTMLInputElement;
        fireEvent.change(fileInput, {
            target: { files: fileListMock }
        });
        await waitFor(() =>
            expect(project.testFile).toHaveBeenCalledWith(
                mockFileContents,
                mockFiles.map((file) => file.fileObject)
            )
        );
        await waitFor(() => expect(changedListener).toHaveBeenCalledTimes(0));
        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(0);
    });
});

describe('ParamList display sync w/ project property values', () => {
    afterEach(cleanupParams);

    it('syncs values in the project with param display (twoWaySync)', async () => {
        const [project] = renderParams(false, SectionOption.NoSections, true);

        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        expect(numberInput.value).toBe('42');
        expect(project.testNumber).toBe(42);
        project.testNumber = 43;
        await waitFor(() => expect(numberInput.value).toBe('43'));
        expect(project.testNumber).toBe(43);

        const booleanInput = screen.getByTestId('boolean-param-input') as HTMLInputElement;
        expect(booleanInput.checked).toBe(true);
        expect(project.testBoolean).toBe(true);
        project.testBoolean = false;
        await waitFor(() => expect(booleanInput.checked).toBe(false));
        expect(project.testBoolean).toBe(false);

        const stringInput = screen.getByTestId('string-param-input-singleline') as HTMLInputElement;
        expect(stringInput.value).toBe('hello');
        expect(project.testString).toBe('hello');
        project.testString = 'goodbye';
        await waitFor(() => expect(stringInput.value).toBe('goodbye'));
        expect(project.testString).toBe('goodbye');

        const numericArrayInput = screen.getAllByTestId(
            'number-param-slider'
        ) as HTMLInputElement[];
        numericArrayInput.shift(); // first is the non-array numeric input
        expect(numericArrayInput.length).toBe(3);
        expect(numericArrayInput[0].value).toBe('1');
        expect(numericArrayInput[1].value).toBe('2');
        expect(numericArrayInput[2].value).toBe('3');
        expect(project.testNumericArray).toEqual([1, 2, 3]);
        project.testNumericArray = [4, 5, 6];
        await waitFor(() => {
            expect(numericArrayInput[0].value).toBe('4');
            expect(numericArrayInput[1].value).toBe('5');
            expect(numericArrayInput[2].value).toBe('6');
        });
        expect(project.testNumericArray).toEqual([4, 5, 6]);

        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(4);
    });

    it("doesn't sync values with !twoWaySync", async () => {
        const [project] = renderParams(false, SectionOption.NoSections, false);

        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        expect(numberInput.value).toBe('42');
        expect(project.testNumber).toBe(42);
        project.testNumber = 43;
        await new Promise((r) => setTimeout(r, 100)); // Make sure displaySyncLoop has time to run
        expect(numberInput.value).toBe('42');
        expect(project.testNumber).toBe(43);

        const booleanInput = screen.getByTestId('boolean-param-input') as HTMLInputElement;
        expect(booleanInput.checked).toBe(true);
        expect(project.testBoolean).toBe(true);
        project.testBoolean = false;
        await new Promise((r) => setTimeout(r, 100)); // Make sure displaySyncLoop has time to run
        expect(booleanInput.checked).toBe(true);
        expect(project.testBoolean).toBe(false);

        const stringInput = screen.getByTestId('string-param-input-singleline') as HTMLInputElement;
        expect(stringInput.value).toBe('hello');
        expect(project.testString).toBe('hello');
        project.testString = 'goodbye';
        await new Promise((r) => setTimeout(r, 100)); // Make sure displaySyncLoop has time to run
        () => expect(stringInput.value).toBe('hello');
        expect(project.testString).toBe('goodbye');

        const numericArrayInput = screen.getAllByTestId(
            'number-param-slider'
        ) as HTMLInputElement[];
        numericArrayInput.shift(); // first is the non-array numeric input
        expect(numericArrayInput.length).toBe(3);
        expect(numericArrayInput[0].value).toBe('1');
        expect(numericArrayInput[1].value).toBe('2');
        expect(numericArrayInput[2].value).toBe('3');
        expect(project.testNumericArray).toEqual([1, 2, 3]);
        project.testNumericArray = [4, 5, 6];
        await new Promise((r) => setTimeout(r, 100)); // Make sure displaySyncLoop has time to run
        expect(numericArrayInput[0].value).toBe('1');
        expect(numericArrayInput[1].value).toBe('2');
        expect(numericArrayInput[2].value).toBe('3');

        expect(project.testNumericArray).toEqual([4, 5, 6]);

        expect(ParamValueProvider.setValue).toHaveBeenCalledTimes(0);
    });
});

describe('ParamList w/ presets', () => {
    afterEach(cleanupParams);

    it('changes values when a preset is applied', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [project, changedListener, component] = renderParams(
            false,
            SectionOption.NoSections,
            false
        );
        expect(component.presetEdited).toBe(false);
        component.applyPreset('preset1');
        expect(component.presetEdited).toBe(false);

        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        await waitFor(() => expect(numberInput.value).toBe('43'));
        expect(project.testNumber).toBe(43);

        const booleanInput = screen.getByTestId('boolean-param-input') as HTMLInputElement;
        expect(booleanInput.checked).toBe(false);
        expect(project.testBoolean).toBe(false);

        const stringInput = screen.getByTestId('string-param-input-singleline') as HTMLInputElement;
        expect(stringInput.value).toBe('goodbye');
        expect(project.testString).toBe('goodbye');

        const numericArrayInput = screen.getAllByTestId(
            'number-param-slider'
        ) as HTMLInputElement[];
        numericArrayInput.shift(); // first is the non-array numeric input
        expect(numericArrayInput.length).toBe(3);
        expect(numericArrayInput[0].value).toBe('4');
        expect(numericArrayInput[1].value).toBe('5');
        expect(numericArrayInput[2].value).toBe('6');
        expect(project.testNumericArray).toEqual([4, 5, 6]);
    });

    it('presetEdited=true when loading values that differ from selected preset', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [project, changedListener, component] = renderParams(
            false,
            SectionOption.NoSections,
            false,
            'preset1'
        );
        expect(component.presetEdited).toBe(true);
        component.applyPreset('preset1');
        expect(component.presetEdited).toBe(false);
    });

    it('presetEdited changes when default value changes are committed', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [project, changedListener, component] = renderParams(true);
        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        expect(component.presetEdited).toBe(false);
        fireEvent.input(numberInput, { target: { value: '43' } });
        expect(component.presetEdited).toBe(false);
        fireEvent.change(numberInput, { target: { value: '44' } });
        expect(component.presetEdited).toBe(true);
        component.applyPreset(defaultPresetKey);
        expect(component.presetEdited).toBe(false);
    });

    it('presetEdited changes when preset values changes are committed', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [project, changedListener, component] = renderParams(true);
        expect(component.presetEdited).toBe(false);
        component.applyPreset('preset2');
        expect(component.presetEdited).toBe(false);
        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        fireEvent.change(numberInput, { target: { value: '42' } });
        expect(component.presetEdited).toBe(true);
        component.applyPreset(defaultPresetKey);
        expect(component.presetEdited).toBe(false);
    });

    it('presetEdited=true after project updates values internally', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [project, changedListener, component] = renderParams(true);
        expect(component.presetEdited).toBe(false);
        project.testNumber = 43;
        await new Promise((r) => setTimeout(r, 100)); // Make sure displaySyncLoop has time to run
        expect(component.presetEdited).toBe(true);
    });

    it('sets presetEdited when changing projects', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [project, changedListener, component] = renderParams(true);
        expect(component.presetEdited).toBe(false);

        // Create a new project and set values that don't correspond with the defaults
        const project2 = new TestProject();
        project2.testNumber = 43;
        project2.testBoolean = false;
        project2.testString = 'goodbye';
        project2.testNumericArray = [4, 5, 6];
        const testProjectConfig = ProjectConfigFactory.projectConfigFrom({
            applyDuringInput: true,
            twoWaySync: true
        });
        const testTuple: ProjectTuple = {
            key: 'testProject2',
            project: project2,
            config: testProjectConfig,
            params: paramsWithApplyDuringInput(true),
            presets: testPresets
        };

        // After updating the projectTuple, preset should be edited
        component.projectTuple = testTuple;
        expect(component.presetEdited).toBe(true);
    });

    it('enables partial preset application (with not all params defined)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [project, changedListener, component] = renderParams(
            false,
            SectionOption.NoSections,
            false
        );

        // Apply a preset with all params defined

        component.applyPreset('preset1');

        const numberInput = screen.getAllByTestId('number-param-slider')[0] as HTMLInputElement;
        await waitFor(() => expect(numberInput.value).toBe('43'));
        expect(project.testNumber).toBe(43);

        const booleanInput = screen.getByTestId('boolean-param-input') as HTMLInputElement;
        expect(booleanInput.checked).toBe(false);
        expect(project.testBoolean).toBe(false);

        const stringInput = screen.getByTestId('string-param-input-singleline') as HTMLInputElement;
        expect(stringInput.value).toBe('goodbye');
        expect(project.testString).toBe('goodbye');

        const numericArrayInput = screen.getAllByTestId(
            'number-param-slider'
        ) as HTMLInputElement[];
        numericArrayInput.shift(); // first is the non-array numeric input
        expect(numericArrayInput.length).toBe(3);
        expect(numericArrayInput[0].value).toBe('4');
        expect(numericArrayInput[1].value).toBe('5');
        expect(numericArrayInput[2].value).toBe('6');
        expect(project.testNumericArray).toEqual([4, 5, 6]);

        // Apply a preset with only some params defined

        component.applyPreset('preset3');

        // Wait for display sync loop to make sure there's no error...
        await new Promise((r) => setTimeout(r, 100));

        await waitFor(() => expect(numberInput.value).toBe('45'));
        expect(project.testNumber).toBe(45);

        expect(booleanInput.checked).toBe(true);
        expect(project.testBoolean).toBe(true);

        expect(stringInput.value).toBe('goodbye');
        expect(project.testString).toBe('goodbye');

        expect(numericArrayInput.length).toBe(3);
        expect(numericArrayInput[0].value).toBe('4');
        expect(numericArrayInput[1].value).toBe('5');
        expect(numericArrayInput[2].value).toBe('6');
        expect(project.testNumericArray).toEqual([4, 5, 6]);
    });
});
