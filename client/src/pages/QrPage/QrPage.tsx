import { useRef, useState } from 'react';

import { useSurveyStore } from '@/stores';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

import '@/styles/complete.css';

import { useApi } from '@/hooks';
import { printQrCodePdf } from '@/utils/qrCodeUtils';

// Description: Displays referral QR codes and allows them to be printing

export default function QrPage() {
	const navigate = useNavigate();
	const { surveyData } = useSurveyStore();
	const childSurveyCodes = surveyData?.childSurveyCodes ?? [];
	const qrRefs = useRef<(HTMLDivElement | null)[]>([]);
	const [notEligibleForCoupons, setNotEligibleForCoupons] = useState(false);

	// Print PDF with custom paper size (62mm width)
	const handlePrint = () => {
		printQrCodePdf(qrRefs.current, childSurveyCodes);
	};

	return (
		<div className="completed-survey-page">
			<div className="completed-survey-container">
				<h2>Referral QR Codes</h2>
				<p>Provide these QR codes to referred individuals.</p>

				{/* Display QR Codes */}
				<div className="print-area">
					<div className="qr-code-container">
						{childSurveyCodes.length > 0 ? (
							childSurveyCodes.map(
								(code: string, index: number) => {
									const qrSurveyCode = code;
									return (
										<div
											key={index}
											className="qr-box"
											ref={el => {
												qrRefs.current[index] = el;
											}}
										>
											<QRCodeCanvas
												value={qrSurveyCode}
												size={120}
												level="M"
											/>
											<p className="qr-code-text">
												{index + 1}. Referral Code:{' '}
												{code}
											</p>
										</div>
									);
								}
							)
						) : (
							<p>No referral codes available.</p>
						)}
					</div>
				</div>

				{/* Checkbox for recording ineligibility */}
				<div style={{ 
					margin: '20px 0', 
					padding: '15px', 
					backgroundColor: '#f5f5f5', 
					borderRadius: '8px',
					display: 'flex',
					alignItems: 'center',
					gap: '10px'
				}}>
					<input
						type="checkbox"
						id="notEligible"
						checked={notEligibleForCoupons}
						onChange={(e) => setNotEligibleForCoupons(e.target.checked)}
						style={{ 
							width: '18px', 
							height: '18px',
							cursor: 'pointer'
						}}
					/>
					<label 
						htmlFor="notEligible" 
						style={{ 
							margin: 0, 
							cursor: 'pointer',
							fontSize: '16px',
							fontWeight: '500'
						}}
					>
						Participant not eligible for coupons (no coupons provided)
					</label>
				</div>

				<div className="qr-buttons">
					<button 
						className="generate-btn" 
						onClick={handlePrint}
						disabled={notEligibleForCoupons}
						style={{
							opacity: notEligibleForCoupons ? 0.5 : 1,
							cursor: notEligibleForCoupons ? 'not-allowed' : 'pointer'
						}}
					>
						Print QR Codes
					</button>
					<button
						className="generate-btn"
						onClick={() => navigate('/dashboard')}
					>
						Complete Surveying Process
					</button>
				</div>
			</div>
		</div>
	);
}
