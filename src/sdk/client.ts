/*!
 * @license MIT
 */

import fetch from 'cross-fetch';
import { escape } from 'querystring';

export interface PublicRoomsResponse {
    chunk: RoomDefinition[];
    totalRoomCountEstimate: number;
    nextBatch: string;
}

export interface RoomDefinition {
    room_id: string;
    num_joined_members: number;
    aliases: string[];
    name?: string;
    canonical_alias?: string;
    world_readable: boolean;
    guest_can_join: boolean;
}

export enum LoginType {
    Token = 'm.login.token',
    UsernamePasword = 'm.login.password',
    SAML2 = 'm.login.saml2',
}

export interface LoginOptions {
    user?: string;
    password?: string;
    token?: string;
    relayState?: string;
}

export interface PublicRoomsRequestOptions {
    server?: string;
    limit?: number;
    searchTerm?: string;
    since?: string;
}

/**
 * A matrix client instance
 */
export class Client {
    private host: string;
    private token?: string;

    public constructor(host: string) {
        this.host = host;
    }

    /**
     * Login with username and password
     */
    public async loginWithCredentials(username: string, password: string) {
        return this.login(LoginType.UsernamePasword, {
            user: username,
            password: password,
        });
    }

    /**
     * Login with a token
     */
    public async loginWithToken(token: string) {
        return this.login(LoginType.Token, {
            token,
        });
    }

    /**
     * Login with SAML2
     */
    public async loginWithSAML2(relayState: string) {
        return this.login(LoginType.SAML2, {
            relayState,
        });
    }

    /**
     * Return all or filtered rooms
     */
    public async getPublicRooms(options: PublicRoomsRequestOptions): Promise<PublicRoomsResponse> {
        let headers;
        if (typeof this.token === 'string') {
            headers = {
                authorization: `Bearer ${this.token}`,
            };
        }
        let filter;
        if (typeof options.searchTerm === 'string') {
            filter = {
                generic_search_term: options.searchTerm,
            };
        }

        const url = this.buildURL('publicRooms', { server: options.server  });

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                limit: options.limit,
                filter,
            }),
            headers,
        });

        await this.isSuccessfullRequest(response);

        const body = await response.json();

        return {
            chunk: body.chunk,
            nextBatch: body.next_batch,
            totalRoomCountEstimate: body.total_room_count_estimate,
        };
    }

    /**
     * Joins a room
     */
    public async joinRoom(roomIdOrAlias: string): Promise<void> {
        let headers;
        if (typeof this.token === 'string') {
            headers = {
                authorization: `Bearer ${this.token}`,
            };
        }
        const response = await fetch(this.buildURL(`join/${escape(roomIdOrAlias)}`), {
            method: 'POST',
            headers,
        });

        await this.isSuccessfullRequest(response);
    }

    /**
     * Obtains all joined rooms by the server
     */
    public async getJoinedRooms(): Promise<string[]> {
        let headers;
        if (typeof this.token === 'string') {
            headers = {
                authorization: `Bearer ${this.token}`,
            };
        }
        const response = await fetch(this.buildURL('joined_rooms'), {
            headers,
        });

        await this.isSuccessfullRequest(response);

        const body = await response.json();

        return body.joined_rooms;
    }

    /**
     * Logs you out and destroys your session
     */
    public async logout(): Promise<void> {
        let headers;
        if (typeof this.token === 'string') {
            headers = {
                authorization: `Bearer ${this.token}`,
            };
        }

        await fetch(this.buildURL('logout'), {
            headers,
        });
    }

    /**
     * Constructs a url from an endpoint
     */
    private buildURL(endpoint: string, queryArgs: { [index: string]: string | undefined } = {}): string {
        let query = '';
        if (Object.keys(queryArgs).length > 0) {
            query = '?';
            for (const key of Object.keys(queryArgs)) {
                if (typeof queryArgs[key] === 'string') {
                    query += `${key}=${queryArgs[key]}`;
                }
            }
        }
        return `${this.host}/_matrix/client/unstable/${endpoint}${query}`;
    }

    /**
     * Requests a token from the server by username and password
     */
    private async login(loginType: LoginType, loginOptions: LoginOptions): Promise<void> {
        const response = await fetch(this.buildURL('login'), {
            method: 'POST',
            body: JSON.stringify({
                ...loginOptions,
                type: loginType,
            }),
        });

        await this.isSuccessfullRequest(response);

        const body = await response.json();

        if (!((typeof body.access_token === 'string') && (body.access_token.length > 0))) {
            throw new Error('No AccessToken on response');
        }

        this.token = body.access_token;
    }

    /**
     * Throws an error if the request is not successfull
     */
    private async isSuccessfullRequest(response: Response) {
        if (!response.status.toString().startsWith('2')) {
            console.error(await response.json());
            throw new Error('Request Failed');
        }
    }
}
