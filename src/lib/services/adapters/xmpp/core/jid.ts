export class JID {
    constructor(readonly local: string, readonly domain: string, readonly resource: string) {
    }

    [Symbol.toPrimitive](hint: 'number' | 'string' | 'boolean') {
        if (hint === 'number') {
            return NaN;
        }

        if (hint === 'string') {
            return this.toString();
        }

        return true;
    }

    toString() {
        let s = this.domain;
        if (this.local) {
            s = this.local + '@' + s;
        }

        if (this.resource) {
            s = s + '/' + this.resource;
        }

        return s;
    }


    /**
     * Comparison function
     * */
    equals(other: { local: string, domain: string, resource: string }) {
        return (
            this.local === other.local &&
            this.domain === other.domain &&
            this.resource === other.resource
        );
    }

    bare() {
        return new JID(this.local, this.domain, null);
    }
}

export function parseJid(jid: string) {
    let local;
    let resource;

    const resourceStart = jid.indexOf('/');
    if (resourceStart !== -1) {
        resource = jid.slice(resourceStart + 1);
        jid = jid.slice(0, resourceStart);
    }

    const atStart = jid.indexOf('@');
    if (atStart !== -1) {
        local = jid.slice(0, atStart);
        jid = jid.slice(atStart + 1);
    }

    return new JID(local, jid, resource);
}
