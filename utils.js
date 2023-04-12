import Toast from 'react-native-toast-message'
import {i18n} from './i18n/i18n.js'
import * as FileSystem from 'expo-file-system'
import * as Localization from 'expo-localization'
import axios from 'axios'

export async function fetchAttachments(boardId, stackId, cardId, server, token) {
    console.log('fetching attachments from server')
    return await axios.get(server.value + `/index.php/apps/deck/api/v1.1/boards/${boardId}/stacks/${stackId}/cards/${cardId}/attachments`, {
        timeout: 8000,
        headers: {
           'Content-Type': 'application/json',
           'Authorization': token
        }
    }).then((resp) => {
       if (resp.status !== 200) {
           Toast.show({
                type: 'error',
               text1: i18n.t('error'),
               text2: resp,
           })
           console.log('Error', resp)
       } else {
            console.log('attachments fetched from server')
            const attachments =  resp.data.map(attachment => {
               return {
                    'id': attachment.id,
                    'author': attachment.createdBy,
                    'creationDate': new Date(attachment.createdAt * 1000).toLocaleDateString(Localization.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
                    'name': attachment.data
               }
           })
           return attachments
   }
    }).catch((error) => {
       Toast.show({
           type: 'error',
            text1: i18n.t('error'),
           text2: error.message,
       })
       console.log(error)
    })
}

export async function getAttachmentURI(attachment, boardId, stackId, cardId, server, token) {
    console.log(`Getting attachment URI for attachement ${attachment.name}`)
    try {
        // iOS does not like spaces in file names.
        const filename = attachment.name.replaceAll(/\s/g,'_')
        // Downloads file if not already done
        const fileInfo = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + filename)
        let uri
        if (!fileInfo.exists) {
            console.log('Downloading attachment')
            const resp = await FileSystem.downloadAsync(
                server.value + `/index.php/apps/deck/api/v1.1/boards/${boardId}/stacks/${stackId}/cards/${cardId}/attachments/file/${attachment.id}`,
                FileSystem.cacheDirectory + filename,
                {
                    headers: {
                        'Authorization': token
                    },
                },
            )
            uri = await FileSystem.getContentUriAsync(resp.uri)

        } else {
            console.log('File already in cache')
            uri = await FileSystem.getContentUriAsync(fileInfo.uri)
        }
        console.log(`attachment URI is ${uri}`)
        return uri
    } catch(error) {
        Toast.show({
            type: 'error',
            text1: i18n.t('error'),
            text2: error.message,
        })
        console.log(error)
        return null
    }

}

// Gets user details from the server
export async function getUserDetails(userId, server, token) {
    return axios.get(server.value + `/ocs/v1.php/cloud/users/${userId}`,
        {
            headers: {
                'Authorization': token,
                'OCS-APIRequest': true,
            },
        }
    ).then( resp => {
        return resp.data.ocs.data
    })
}

// Tells if a user has edit rights on a board
export function canUserEditBoard(user, board) {

    // Owner may edit their board obviously
    if (user === board.owner.uid) return true

    // If user is listed in the board's acl explicitly, then return his edit permissions
    const userPermissions = board.acl.find(acl => acl.participant.uid==user)?.permissionEdit
    if (userPermissions !== undefined) return userPermissions

    // If user is member of several groups listed in the board's acl, every groups must have edit rights
    const userGroupPermissions = board.acl.every( acl => {
        if (user.groups.includes(acl.participant.uid)) {
            return acl.permissionEdit
        }
        return true
    })

    return userGroupPermissions

}