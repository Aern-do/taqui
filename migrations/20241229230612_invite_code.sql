CREATE FUNCTION gen_random_invite_code()
        RETURNS varchar
        LANGUAGE plpgsql
    AS
$$
DECLARE
    LENGTH CONSTANT integer = 8;
    ALLOWED_CHARACTERS CONSTANT varchar[] = REGEXP_SPLIT_TO_ARRAY('abcdefghijklmnopqrstuvwxyz', '');

    result varchar = '';
BEGIN
    FOR _ in 0..(LENGTH-1) LOOP
        result = result || (ARRAY_SAMPLE(ALLOWED_CHARACTERS, 1))[1];
    END LOOP;

    RETURN result;
END;
$$;

ALTER TABLE invites 
ADD COLUMN code varchar NOT NULL DEFAULT (gen_random_invite_code());