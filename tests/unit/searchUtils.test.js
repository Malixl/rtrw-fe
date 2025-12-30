import { describe, it, expect } from 'vitest';
import { fuzzyMatch, highlightParts, filterTree, filterList } from '@/components/Map/searchUtils';

describe('searchUtils', () => {
    it('fuzzyMatch should match substrings and in-order chars', () => {
        expect(fuzzyMatch('gere', 'Gereja Katolik')).toBeTruthy();
        expect(fuzzyMatch('gkj', 'Gereja Katolik Jakarta')).toBeTruthy(); // g...k...j in order
        expect(fuzzyMatch('xyz', 'abc')).toBeFalsy();
    });

    it('highlightParts should produce matched parts for substring', () => {
        const parts = highlightParts('Kawasan Lindung', 'kawasan');
        const matched = parts.filter((p) => p.match).map((p) => p.text).join('');
        expect(matched.toLowerCase()).toBe('kawasan');
    });

    it('highlightParts should highlight characters in-order if not substring', () => {
        const parts = highlightParts('Gereja', 'grj');
        // should highlight g, r, j in order
        const matches = parts.filter((p) => p.match).map((p) => p.text).join('');
        expect(matches.toLowerCase()).toBe('grj'.toLowerCase());
    });

    it('filterTree should return nodes that match or have matching children', () => {
        const tree = [
            { title: 'Parent A', children: [{ title: 'Child One' }, { title: 'Another' }] },
            { title: 'Parent B', children: [{ title: 'Something' }] }
        ];

        const res = filterTree(tree, 'child');
        expect(res.length).toBe(1);
        expect(res[0].title).toBe('Parent A');
        expect(res[0].children.length).toBe(1);
    });

    it('filterList should filter flat items by name or nama', () => {
        const items = [
            { id: 1, name: 'Kota Gorontalo' },
            { id: 2, name: 'Kabupaten Pohuwato' },
            { id: 3, name: 'Non Matching' }
        ];

        const res = filterList(items, 'gorontalo');
        expect(res.length).toBe(1);
        expect(res[0].id).toBe(1);
    });
});
