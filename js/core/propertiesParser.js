export class PropertiesParser {
    static parse(content) {
        const lines = content.split('\n');
        const data = {};

        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && line.includes('=')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                data[key.trim()] = value;
            }
        });

        return data;
    }

    /**
     * Group flat keys into a nested object structure.
     * e.g. "surnom.principal.johann" -> { surnom: { principal: { johann: "..." } } }
     */
    static nest(flatData) {
        const nested = {};

        for (const key in flatData) {
            const parts = key.split('.');
            let current = nested;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    current[part] = flatData[key];
                } else {
                    current[part] = current[part] || {};
                    current = current[part];
                }
            }
        }

        return nested;
    }
}
