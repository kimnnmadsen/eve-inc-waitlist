import logging
from typing import Union

from esipy import EsiClient
from urllib3.exceptions import ReadTimeoutError

from waitlist.storage.database import SSOToken
from waitlist.utility.swagger.eve import get_esi_client, get_expire_time, make_error_response, ESIEndpoint, ESIResponse
from waitlist.utility.swagger.eve.character.responses import CharacterInfo, FleetInfo

logger = logging.getLogger(__name__)


class CharacterEndpoint(ESIEndpoint):
    def __init__(self) -> None:
        super().__init__()
        self.esi_client: EsiClient = get_esi_client(None, True,
                                                    retry_request=True)

    def get_character_info(self, char_id: int) -> Union[
            CharacterInfo,
            ESIResponse]:

        try:
            resp = self.esi_client.request(self._api().op['get_characters_character_id'](character_id=char_id))
            if resp.status == 200:
                return CharacterInfo(get_expire_time(resp), resp.status, None, resp.data)
            else:
                logger.info(f'Got error requesting info for character={char_id}')
                return make_error_response(resp)

        except ReadTimeoutError as e:
            logger.error(f'ESI Read Timeout on get_characters_character_id {e}')
            raise e

    def get_fleet_info(self, token: SSOToken, char_id: int) -> Union[FleetInfo, ESIResponse]:
        authed_esi_client = get_esi_client(token, False)
        try:
            resp = authed_esi_client.request(self._api().op['get_characters_character_id_fleet'](character_id=char_id))
            if resp.status == 200:
                return FleetInfo(get_expire_time(resp), resp.status, None, resp.data)
            else:
                logger.error(f'Got error requesting fleet info for character={char_id}')
                return make_error_response(resp)
        except ReadTimeoutError as e:
            logger.error(f'ESI Read Timeout on get_characters_character_id {e}')
            raise e
