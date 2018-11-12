/*!
 * @license MIT
 */

import { logger  } from 'bs-logger';
const sdk = require('matrix-js-sdk');

interface PublicRoomsResponse {
    chunk: RoomDefinition[];
    total_room_count_estimate: number;
    next_batch: string;
}

interface RoomDefinition {
    room_id: string;
    num_joined_members: number;
    aliases: string[];
    name?: string;
    canonical_alias?: string;
    world_readable: boolean;
    guest_can_join: boolean;
}

// tslint:disable-next-line
(async function() {
    try {
        logger('Starting up…');
        const client = sdk.createClient('https://matrix.org');
        const rooms: PublicRoomsResponse = await client.publicRooms();
        const jsInJena =
            rooms
            .chunk
            .filter(
                item => typeof item.canonical_alias === 'string' ?
                    item.canonical_alias.includes('#JSinJena:matrix.org') :
                    false,
                   )
            .pop();
        if (typeof jsInJena === 'undefined') {
            throw new Error('Channel not found');
        }
        logger('jsInJena room', jsInJena);
        const room = await client.joinRoom(jsInJena.room_id);

        logger('room', room);

        process.exit(0);
    } catch (error) {
        logger('An error happened', error);
        process.exit(0);
    }
})();
