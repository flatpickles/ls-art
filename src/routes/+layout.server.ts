import type { PageServerLoad, PageServerLoadEvent } from './$types';

import { dev } from '$app/environment';
import ProjectLoader from '$lib/base/ProjectLoading/ProjectLoader';
import { settingsStore } from '$lib/base/Util/AppState';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = (async ({ cookies, request, url }: PageServerLoadEvent) => {
    // Redirect longitude.studio/shop to the Square site
    if (url.pathname.includes('/shop')) {
        throw redirect(301, 'https://longitude-studio.square.site/');
    }

    settingsStore.loadCookies(cookies);
    const projects = await ProjectLoader.loadAvailableProjects();
    return {
        projects,
        requestUrl: request.url
    };
}) satisfies PageServerLoad;

// Only use SSR in production, to avoid flickery hot reloads in dev
export const ssr = !dev;
