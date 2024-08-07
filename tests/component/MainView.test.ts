/* eslint-disable @typescript-eslint/no-explicit-any */

import { settingsStore, stateStore } from '$lib/base/Util/AppState';
import { PanelState } from '$lib/base/Util/PanelState';
import MainViewWithContent from '$lib/components/TestComponents/MainViewWithContent.svelte';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mocking for getContext is required for HTMLCanvasElement to work with Jest/Vitest
// https://github.com/hustcc/jest-canvas-mock/issues/2
global.HTMLCanvasElement.prototype.getContext = () => null;

describe('MainView layout', () => {
    afterEach(cleanup);

    it('renders main wrapper', async () => {
        render(MainViewWithContent);

        const wrapper = screen.getByTestId('main-wrapper');
        expect(wrapper).toBeDefined();
    });

    it("doesn't show detail panel when the project doesn't have details", async () => {
        render(MainViewWithContent, {
            hasDetails: false
        });

        const detailPanel = screen.queryByTestId('right-panel-wrapper');
        expect(detailPanel).toBeNull();
    });
});

describe('Redirect override for project list panel state', () => {
    afterEach(cleanup);

    it('redirects to the project list panel if the redirect override is set', async () => {
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.Hidden,
            projectListRedirectOverride: true,
            projectListRedirectOverrideState: PanelState.Visible
        });

        render(MainViewWithContent, {
            context: new Map(Object.entries({ pageRedirected: true }))
        } as any);

        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.Visible)
        );
    });

    it('does not redirect to the project list panel if not redirected', async () => {
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.Hidden,
            projectListRedirectOverride: true,
            projectListRedirectOverrideState: PanelState.Visible
        });

        render(MainViewWithContent, {
            context: new Map(Object.entries({ pageRedirected: false }))
        } as any);

        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.Hidden)
        );
    });

    it('does not redirect to the project list panel if the redirect override is disabled', async () => {
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.Hidden,
            projectListRedirectOverride: false,
            projectListRedirectOverrideState: PanelState.Visible
        });

        render(MainViewWithContent, {
            context: new Map(Object.entries({ pageRedirected: true }))
        } as any);

        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.Hidden)
        );
    });
});

describe('Panel button visibility', () => {
    afterEach(cleanup);

    it('hides panel show buttons after a timeout then shows panel show buttons on mousemove', async () => {
        // Set hidePanelButtonsTimeout
        settingsStore.set({
            ...get(settingsStore),
            hidePanelButtonsTimeout: 10,
            projectListPanelState: PanelState.Hidden,
            projectDetailPanelState: PanelState.Hidden
        });

        // Render
        const { getAllByTestId } = render(MainViewWithContent);

        // Find & validate show buttons wrapper
        const showButtonsWrapper = getAllByTestId('show-button-wrapper');
        expect(showButtonsWrapper).toBeDefined();
        expect(showButtonsWrapper.length).toBe(2);
        expect(showButtonsWrapper[0].classList.contains('hidden')).toBe(false);
        expect(showButtonsWrapper[1].classList.contains('hidden')).toBe(false);

        // Wait then check again
        await new Promise((r) => setTimeout(r, 20));
        expect(showButtonsWrapper[0].classList.contains('hidden')).toBe(true);
        expect(showButtonsWrapper[1].classList.contains('hidden')).toBe(true);

        // Move the mouse then check again
        const wrapper = screen.getByTestId('main-wrapper');
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: 5, clientY: 5 }
        });
        await waitFor(() => expect(showButtonsWrapper[0].classList.contains('hidden')).toBe(false));
        await waitFor(() => expect(showButtonsWrapper[1].classList.contains('hidden')).toBe(false));
    });

    it("doesn't hide if hidePanelButtonsTimeout is undefined", async () => {
        // Set hidePanelButtonsTimeout
        settingsStore.set({
            ...get(settingsStore),
            hidePanelButtonsTimeout: undefined,
            projectListPanelState: PanelState.Hidden,
            projectDetailPanelState: PanelState.Hidden
        });

        // Render
        const { getAllByTestId } = render(MainViewWithContent);

        // Find & validate show buttons wrapper
        const showButtonsWrapper = getAllByTestId('show-button-wrapper');
        expect(showButtonsWrapper).toBeDefined();
        expect(showButtonsWrapper.length).toBe(2);
        expect(showButtonsWrapper[0].classList.contains('hidden')).toBe(false);
        expect(showButtonsWrapper[1].classList.contains('hidden')).toBe(false);

        // Wait then check again
        await new Promise((r) => setTimeout(r, 100));
        expect(showButtonsWrapper[0].classList.contains('hidden')).toBe(false);
        expect(showButtonsWrapper[1].classList.contains('hidden')).toBe(false);
    });

    it("doesn't hide if hidePanelButtonsTimeout is defined but we're on a touch client", async () => {
        window.ontouchstart = vi.fn(); // mock touch client

        // Set hidePanelButtonsTimeout
        settingsStore.set({
            ...get(settingsStore),
            hidePanelButtonsTimeout: 10,
            projectListPanelState: PanelState.Hidden,
            projectDetailPanelState: PanelState.Hidden
        });

        // Render
        const { getAllByTestId } = render(MainViewWithContent);

        // Find & validate show buttons wrapper
        const showButtonsWrapper = getAllByTestId('show-button-wrapper');
        expect(showButtonsWrapper).toBeDefined();
        expect(showButtonsWrapper.length).toBe(2);
        expect(showButtonsWrapper[0].classList.contains('hidden')).toBe(false);
        expect(showButtonsWrapper[1].classList.contains('hidden')).toBe(false);

        // Wait then check again
        await new Promise((r) => setTimeout(r, 20));
        expect(showButtonsWrapper[0].classList.contains('hidden')).toBe(false);
        expect(showButtonsWrapper[1].classList.contains('hidden')).toBe(false);
    });
});

describe('Settings', () => {
    afterEach(cleanup);
    it('shows and hides the settings panel', async () => {
        const { getByTestId } = render(MainViewWithContent);

        // No settings overlay to start
        expect(get(stateStore).settingsPresented).toBe(false);
        expect(() => getByTestId('settings-overlay')).toThrow();

        // Click the settings button
        const settingsButton = getByTestId('right-footer-button');
        fireEvent.click(settingsButton);
        await waitFor(() => expect(get(stateStore).settingsPresented).toBe(true));

        // Check that the settings panel is displayed (contents tested elsewhere)
        const settingsOverlay = getByTestId('settings-overlay');
        expect(settingsOverlay).toBeDefined();

        // Click the close button & check that it closes the settings panel
        within(settingsOverlay).getByTestId('right-header-button').click();
        await waitFor(() => expect(get(stateStore).settingsPresented).toBe(false));

        // It seems like settings-overlay is still in the DOM; this is only when using
        // Svelte's transition:fade - a framework bug maybe
    });
});

describe('PanelState.Unavailable', () => {
    afterEach(cleanup);

    it('does not render the project list panel or show button', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.Unavailable
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper and button absence
        expect(() => getByTestId('left-panel-wrapper')).toThrow();
        expect(() => getByTestId('left-show')).toThrow();
    });

    it('does not render the project detail panel or show button', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectDetailPanelState: PanelState.Unavailable
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate right panel wrapper and button absence
        expect(() => getByTestId('right-panel-wrapper')).toThrow();
        expect(() => getByTestId('right-show')).toThrow();
    });
});

describe('PanelState.Static', () => {
    afterEach(cleanup);

    it('renders the project list panel with no hide/show UI', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.Static
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const leftPanelWrapper = getByTestId('left-panel-wrapper');
        expect(leftPanelWrapper).toBeDefined();
        expect(leftPanelWrapper.classList.contains('closed')).toBe(false);

        // Find & validate left panel show button absence
        expect(() => getByTestId('left-show')).toThrow();

        // Find & validate left panel hide button absence
        expect(() => within(leftPanelWrapper).getByTestId('right-header-button')).toThrow();
    });

    it('renders the project detail panel with no hide/show UI', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectDetailPanelState: PanelState.Static
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate right panel wrapper
        const rightPanelWrapper = getByTestId('right-panel-wrapper');
        expect(rightPanelWrapper).toBeDefined();
        expect(rightPanelWrapper.classList.contains('closed')).toBe(false);

        // Find & validate right panel show button absence
        expect(() => getByTestId('right-show')).toThrow();

        // Find & validate right panel hide button absence
        expect(() => within(rightPanelWrapper).getByTestId('right-header-button')).toThrow();
    });
});

describe('PanelState.Visible <-> PanelState.Hidden', () => {
    afterEach(cleanup);

    it('starting with PanelState.Hidden, hides both panels on first render', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.Hidden,
            projectDetailPanelState: PanelState.Hidden
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const leftPanelWrapper = getByTestId('left-panel-wrapper');
        expect(leftPanelWrapper).toBeDefined();
        expect(leftPanelWrapper.classList.contains('closed')).toBe(true);

        // Find & validate right panel wrapper
        const rightPanelWrapper = getByTestId('right-panel-wrapper');
        expect(rightPanelWrapper).toBeDefined();
        expect(rightPanelWrapper.classList.contains('closed')).toBe(true);
    });

    it('starting with PanelState.Visible, shows and hides the project list panel', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.Visible
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const leftPanelWrapper = getByTestId('left-panel-wrapper');
        expect(leftPanelWrapper).toBeDefined();
        expect(leftPanelWrapper.classList.contains('closed')).toBe(false);

        // Click the close button & check that it closes the panel
        within(leftPanelWrapper).getByTestId('right-header-button').click();
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.Hidden);

        // Click the open button & check that it opens the panel
        const openButton = getByTestId('left-show');
        fireEvent.click(openButton);
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.Visible);

        // Check that setting the settingsStore to Hidden from elsewhere closes the panel
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.Hidden
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));
    });

    it('starting with PanelState.Visible, shows and hides the project detail panel', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectDetailPanelState: PanelState.Visible
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const rightPanelWrapper = getByTestId('right-panel-wrapper');
        expect(rightPanelWrapper).toBeDefined();
        expect(rightPanelWrapper.classList.contains('closed')).toBe(false);

        // Click the close button & check that it closes the panel
        within(rightPanelWrapper).getByTestId('right-header-button').click();
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.Hidden);

        // Click the open button & check that it opens the panel
        const openButton = getByTestId('right-show');
        fireEvent.click(openButton);
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.Visible);

        // Check that setting the stateStore to Hidden from elsewhere closes the panel
        settingsStore.set({
            ...get(settingsStore),
            projectDetailPanelState: PanelState.Hidden
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));
    });
});

describe('Panels: PanelState.MousePinnable <-> PanelState.MousePinned', () => {
    afterEach(cleanup);

    it('starting with PanelState.MousePinned, shows both panels on first render', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.MousePinned,
            projectDetailPanelState: PanelState.MousePinned
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const leftPanelWrapper = getByTestId('left-panel-wrapper');
        expect(leftPanelWrapper).toBeDefined();
        expect(leftPanelWrapper.classList.contains('closed')).toBe(false);

        // Find & validate right panel wrapper
        const rightPanelWrapper = getByTestId('right-panel-wrapper');
        expect(rightPanelWrapper).toBeDefined();
        expect(rightPanelWrapper.classList.contains('closed')).toBe(false);
    });

    it('starting with PanelState.MousePinnable, shows and hides the project list panel', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.MousePinnable
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const leftPanelWrapper = getByTestId('left-panel-wrapper');
        expect(leftPanelWrapper).toBeDefined();
        expect(leftPanelWrapper.classList.contains('closed')).toBe(true);

        // Move the mouse outside of the trigger area & check that the panel is unaffected
        const wrapper = screen.getByTestId('main-wrapper');
        const leftTriggerPosition = get(settingsStore).panelMouseTriggerWidth;
        const leftUntriggerPosition = 300; // (estimated panel width)
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition + 10, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinnable);

        // Move the mouse into the left panel trigger area & check that it opens the panel
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition - 10, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinnable);

        // Move the mouse outside of the trigger area & check that the panel is unaffected
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition + 10, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinnable);

        // Move the mouse outside of the interaction area & check that the panel closes
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftUntriggerPosition, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinnable);

        // Open the panel again, then click the pin button
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition - 10, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(false));
        within(leftPanelWrapper).getByTestId('right-header-button').click();
        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinned)
        );

        // Move the mouse outside of the interaction area & check that the panel stays open
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftUntriggerPosition, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(false));
        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinned)
        );

        // Within the panel, click the pin button, check that it unpins and then closes the panel
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition - 10, clientY: 5 }
        });
        within(leftPanelWrapper).getByTestId('right-header-button').click();
        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinnable)
        );
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));

        // Now moving the mouse within the trigger area shouldn't show the panel ...
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition - 15, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));

        // ... until we move the mouse outside of the interaction area ...
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftUntriggerPosition, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));

        // ... and back in!
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition - 15, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(false));
        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinnable)
        );
    });

    it('starting with PanelState.MousePinnable, shows and hides the project detail panel', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectDetailPanelState: PanelState.MousePinnable
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const rightPanelWrapper = getByTestId('right-panel-wrapper');
        expect(rightPanelWrapper).toBeDefined();
        expect(rightPanelWrapper.classList.contains('closed')).toBe(true);

        // Move the mouse outside of the trigger area & check that the panel is unaffected
        const wrapper = screen.getByTestId('main-wrapper');
        const rightTriggerPosition = window.innerWidth - get(settingsStore).panelMouseTriggerWidth;
        const rightUntriggerPosition = window.innerWidth - 300; // (estimated panel width)
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition - 10, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinnable);

        // Move the mouse into the left panel trigger area & check that it opens the panel
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition + 10, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinnable);

        // Move the mouse outside of the trigger area & check that the panel is unaffected
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition - 10, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinnable);

        // Move the mouse outside of the interaction area & check that the panel closes
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightUntriggerPosition, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinnable);

        // Open the panel again, then click the pin button
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition + 10, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(false));
        within(rightPanelWrapper).getByTestId('right-header-button').click();
        await waitFor(() =>
            expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinned)
        );

        // Move the mouse outside of the interaction area & check that the panel stays open
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightUntriggerPosition, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(false));
        await waitFor(() =>
            expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinned)
        );

        // Within the panel, click the pin button, check that it unpins and then closes the panel
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition + 10, clientY: 5 }
        });
        within(rightPanelWrapper).getByTestId('right-header-button').click();
        await waitFor(() =>
            expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinnable)
        );
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));

        // Now moving the mouse within the trigger area shouldn't show the panel ...
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition + 15, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));

        // ... until we move the mouse outside of the interaction area ...
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightUntriggerPosition, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));

        // ... and back in!
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition + 15, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(false));
        await waitFor(() =>
            expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinnable)
        );
    });

    it('pins the panels when the show buttons are clicked (backup for non-mouse devices)', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.MousePinnable,
            projectDetailPanelState: PanelState.MousePinnable
        });
        const { getByTestId } = render(MainViewWithContent);
        const leftPanelWrapper = getByTestId('left-panel-wrapper');
        const rightPanelWrapper = getByTestId('right-panel-wrapper');
        expect(leftPanelWrapper.classList.contains('closed')).toBe(true);
        expect(rightPanelWrapper.classList.contains('closed')).toBe(true);

        // Click the show buttons
        const leftShowButton = getByTestId('left-show');
        const rightShowButton = getByTestId('right-show');
        fireEvent.click(leftShowButton);
        fireEvent.click(rightShowButton);
        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinned)
        );
        await waitFor(() =>
            expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinned)
        );
        expect(leftPanelWrapper.classList.contains('closed')).toBe(false);
        expect(rightPanelWrapper.classList.contains('closed')).toBe(false);
    });
});

describe('Panels: PanelState.MouseUnpinnable', () => {
    afterEach(cleanup);

    it('shows and hides the project list panel', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.MouseUnpinnable
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const leftPanelWrapper = getByTestId('left-panel-wrapper');
        expect(leftPanelWrapper).toBeDefined();
        expect(leftPanelWrapper.classList.contains('closed')).toBe(true);

        // Move the mouse outside of the trigger area & check that the panel is unaffected
        const wrapper = screen.getByTestId('main-wrapper');
        const leftTriggerPosition = get(settingsStore).panelMouseTriggerWidth;
        const leftUntriggerPosition = 300; // (estimated panel width)
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition + 10, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.MouseUnpinnable);

        // Move the mouse into the left panel trigger area & check that it opens the panel
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition - 10, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.MouseUnpinnable);

        // Assert that there's no pin/close button
        expect(() => within(leftPanelWrapper).getByTestId('right-header-button')).toThrow();

        // Move the mouse outside of the trigger area & check that the panel is unaffected
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftTriggerPosition + 10, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.MouseUnpinnable);

        // Move the mouse outside of the interaction area & check that the panel closes
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: leftUntriggerPosition, clientY: 5 }
        });
        await waitFor(() => expect(leftPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectListPanelState).toBe(PanelState.MouseUnpinnable);
    });

    it('shows and hides the project detail panel', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectDetailPanelState: PanelState.MouseUnpinnable
        });
        const { getByTestId } = render(MainViewWithContent);

        // Find & validate left panel wrapper
        const rightPanelWrapper = getByTestId('right-panel-wrapper');
        expect(rightPanelWrapper).toBeDefined();
        expect(rightPanelWrapper.classList.contains('closed')).toBe(true);

        // Move the mouse outside of the trigger area & check that the panel is unaffected
        const wrapper = screen.getByTestId('main-wrapper');
        const rightTriggerPosition = window.innerWidth - get(settingsStore).panelMouseTriggerWidth;
        const rightUntriggerPosition = window.innerWidth - 300; // (estimated panel width)
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition - 10, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MouseUnpinnable);

        // Move the mouse into the left panel trigger area & check that it opens the panel
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition + 10, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MouseUnpinnable);

        // Assert that there's no pin/close button
        expect(() => within(rightPanelWrapper).getByTestId('right-header-button')).toThrow();

        // Move the mouse outside of the trigger area & check that the panel is unaffected
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightTriggerPosition - 10, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(false));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MouseUnpinnable);

        // Move the mouse outside of the interaction area & check that the panel closes
        userEvent.pointer({
            target: wrapper,
            coords: { clientX: rightUntriggerPosition, clientY: 5 }
        });
        await waitFor(() => expect(rightPanelWrapper.classList.contains('closed')).toBe(true));
        expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MouseUnpinnable);
    });

    it('pins the panels when the show buttons are clicked (backup for non-mouse devices)', async () => {
        // Set panel state and render
        settingsStore.set({
            ...get(settingsStore),
            projectListPanelState: PanelState.MouseUnpinnable,
            projectDetailPanelState: PanelState.MouseUnpinnable
        });
        const { getByTestId } = render(MainViewWithContent);
        const leftPanelWrapper = getByTestId('left-panel-wrapper');
        const rightPanelWrapper = getByTestId('right-panel-wrapper');
        expect(leftPanelWrapper.classList.contains('closed')).toBe(true);
        expect(rightPanelWrapper.classList.contains('closed')).toBe(true);

        // Click the show buttons
        const leftShowButton = getByTestId('left-show');
        const rightShowButton = getByTestId('right-show');
        fireEvent.click(leftShowButton);
        fireEvent.click(rightShowButton);
        await waitFor(() =>
            expect(get(settingsStore).projectListPanelState).toBe(PanelState.MousePinned)
        );
        await waitFor(() =>
            expect(get(settingsStore).projectDetailPanelState).toBe(PanelState.MousePinned)
        );
        expect(leftPanelWrapper.classList.contains('closed')).toBe(false);
        expect(rightPanelWrapper.classList.contains('closed')).toBe(false);
    });
});
