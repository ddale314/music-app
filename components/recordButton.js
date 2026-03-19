import styles from '../styles/editor.module.css';

export default function RecordButton({ isRecording, onClick }) {
	return (
		<button 
			onClick={onClick} 
			className={isRecording ? styles.recordBtnActive : styles.recordBtn}
			title={isRecording ? "Stop Recording" : "Record"}
		>
			<div style={{
				width: '14px', 
				height: '14px', 
				backgroundColor: 'currentColor', 
				borderRadius: isRecording ? '2px' : '50%',
				transition: 'all var(--daw-transition)'
			}}></div>
		</button>
	);
}