import { Parser } from 'binary-parser';

/**
 * IFF (Interchange File Format) Loader for Star Wars Galaxies
 * Based on EA IFF specification used by SWG
 * 
 * IFF files are chunked binary format:
 * - FORM chunks: containers
 * - DATA chunks: actual data
 * Each chunk has 4-byte type ID and 4-byte length
 */
export class IFFLoader {
    constructor() {
        this.chunks = [];
    }

    /**
     * Load and parse an IFF file
     * @param {string} url - URL to the .iff file
     * @returns {Promise<Object>} Parsed IFF data
     */
    async load(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            return this.parse(buffer);
        } catch (error) {
            console.error('IFF Load Error:', error);
            throw error;
        }
    }

    /**
     * Parse IFF buffer data
     * @param {Buffer} buffer - Binary data
     * @returns {Object} Parsed chunks
     */
    parse(buffer) {
        this.chunks = [];
        let offset = 0;

        while (offset < buffer.length) {
            const chunk = this.readChunk(buffer, offset);
            if (!chunk) break;
            
            this.chunks.push(chunk);
            offset += chunk.totalSize;
        }

        return {
            chunks: this.chunks,
            getRootForm: () => this.chunks.find(c => c.type === 'FORM')
        };
    }

    /**
     * Read a single IFF chunk
     * @param {Buffer} buffer 
     * @param {number} offset 
     * @returns {Object|null}
     */
    readChunk(buffer, offset) {
        if (offset + 8 > buffer.length) return null;

        // Read chunk type (4 bytes, ASCII)
        const type = buffer.toString('ascii', offset, offset + 4);
        offset += 4;

        // Read chunk size (4 bytes, big-endian)
        const size = buffer.readUInt32BE(offset);
        offset += 4;

        // Read chunk data
        const dataEnd = Math.min(offset + size, buffer.length);
        const data = buffer.slice(offset, dataEnd);

        // Check if it's a FORM (container) chunk
        const isContainer = type === 'FORM' || type === 'LIST' || type === 'CAT ';
        let formType = null;
        let children = [];

        if (isContainer && size >= 4) {
            // First 4 bytes of FORM data is the form type
            formType = data.toString('ascii', 0, 4);
            
            // Parse children chunks
            let childOffset = 4;
            while (childOffset < data.length - 8) {
                const child = this.readChunk(data, childOffset);
                if (!child) break;
                children.push(child);
                childOffset += child.totalSize;
            }
        }

        return {
            type,
            size,
            formType,
            data: isContainer ? null : data,
            children: isContainer ? children : [],
            totalSize: 8 + size + (size % 2) // Pad to even boundary
        };
    }

    /**
     * Find chunk by type
     * @param {string} type - Chunk type (4-char code)
     * @returns {Object|null}
     */
    findChunk(type) {
        return this.findChunkRecursive(this.chunks, type);
    }

    findChunkRecursive(chunks, type) {
        for (const chunk of chunks) {
            if (chunk.type === type) return chunk;
            if (chunk.children.length > 0) {
                const found = this.findChunkRecursive(chunk.children, type);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Extract mesh data from building IFF files
     * @returns {Object|null}
     */
    extractMeshData() {
        // Look for common SWG mesh chunks
        const meshChunk = this.findChunk('MESH') || this.findChunk('MLOD');
        if (!meshChunk) return null;

        // This is a simplified extractor - real SWG meshes are complex
        return {
            type: 'mesh',
            hasData: !!meshChunk,
            chunk: meshChunk
        };
    }
}
