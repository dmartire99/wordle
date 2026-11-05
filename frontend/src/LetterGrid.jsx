import './Game.css'
import { letterStyle } from './util'
export default function LetterGrid({ statuses }) {
    return <>
        <div className='letterGrid'>
            {
                statuses.map((status, index) => <div key={index} className={`letterGridItem ${letterStyle(status)}`}>{String.fromCharCode(65 + index)}</div>)
            }
        </div>
    </>
}