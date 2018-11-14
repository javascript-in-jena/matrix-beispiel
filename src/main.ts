/*!
 * @license MIT
 */

import { logger } from 'bs-logger';
import * as config from 'config';
const sdk = require('matrix-js-sdk');

if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV === '') {
    process.env.NODE_ENV = 'development';
}

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
        const client = sdk.createClient(config.get('server'));

        const response = await client.loginWithPassword (
            config.get('credentials.username'),
            config.get('credentials.password'),
        );

        client._http.useAuthorizationHeader = true;
        client._http.opts['accessToken'] = response.access_token;

        const rooms: PublicRoomsResponse = await client.publicRooms({
            server: 'matrix.org',
            limit: 10,
            include_all_networks: true,
            filter: {
                generic_search_term: 'Javascript in Jena',
            },
        });

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

        await client.logout();

        process.exit(0);
    } catch (error) {
        logger('An error happened', {
            name: error.name,
            stack: error.stack,
            error,
        });
        process.exit(0);
    }
})();
