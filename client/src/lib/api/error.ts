export enum ErrorCode {
    RateLimited = 3000,
    Internal = 4000,

    UnknownUser = 5000,
    UnknownInvite = 5001,
    UnknownGroup = 5002,
    UserAlreadyExists = 5003,
    Validation = 5004,

    InvalidToken = 6000,
    InsufficientPermissions = 6001,
    InvalidCredentials = 6002,
}

export type Component = ["key", string] | ["index", number];
export type Path = Component[];

export interface Entry {
    path: Path;
    message: string;
}

export type Report = Entry[];

export interface ApiError {
    code: ErrorCode;
    details: string | Report;
}
